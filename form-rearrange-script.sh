#!/bin/bash

# ============================================================================
# Onboarding Form Rearrangement Script (Optimized)
# ============================================================================
# Author: UpKeepQR Development Team
# Purpose: Rearrange "Complete Your Setup" form in Onboarding.tsx
# 
# New Structure:
# Section 1: Personal Detail - Name, phone, email, preferred contact method/time
# Section 2: Home Detail - Address+ZIP, home type, sqft, HVAC, heat pump, 
#            water heater, roof age, owner status
# Section 3: Your Interest - Interest type, consultation, budget, timeline, 
#            preferred contact time, notes
# ============================================================================

set -euo pipefail

# === Configuration ===
FORM_FILE="./client/src/pages/Onboarding.tsx"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${FORM_FILE}.backup_${TIMESTAMP}"
NEW_FILE="${FORM_FILE}.new"
DRY_RUN="${DRY_RUN:-false}"

# === Color Codes ===
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No color

# === Error Handler ===
trap 'handle_error $LINENO' ERR

handle_error() {
  echo -e "\n${RED}❌ Script failed at line $1${NC}" >&2
  echo -e "${YELLOW}💡 Check file permissions, syntax, or file path${NC}" >&2
  echo -e "${YELLOW}🔄 Rollback available: cp \"$BACKUP_FILE\" \"$FORM_FILE\"${NC}" >&2
  exit 1
}

# === Cleanup Handler ===
cleanup() {
  if [[ -f "$NEW_FILE" ]]; then
    rm -f "$NEW_FILE"
  fi
}
trap cleanup EXIT

# === Logging Functions ===
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }

# === Main Script ===
echo -e "${YELLOW}🔧 Starting form rearrangement...${NC}"
log_info "Target file: $FORM_FILE"

# Dry run check
if [[ "$DRY_RUN" == "true" ]]; then
  log_warning "DRY RUN MODE - No files will be modified"
  echo -e "  Would create backup: ${BACKUP_FILE}"
  echo -e "  Would overwrite: ${FORM_FILE}"
  exit 0
fi

# File existence check
if [[ ! -f "$FORM_FILE" ]]; then
  log_error "File not found: $FORM_FILE"
  exit 1
fi

# Create backup
if cp "$FORM_FILE" "$BACKUP_FILE"; then
  log_success "Backup created: $BACKUP_FILE"
else
  log_error "Failed to create backup"
  exit 1
fi

# Create the rearranged form file
cat > "${NEW_FILE}" << 'EOFFORM'
import { useState } from 'react';
import { useParams } from 'wouter';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  // Original onboarding fields
  zip: string;
  home_type: string;
  sqft: string;
  hvac_type: string;
  water_heater: string;
  roof_age_years: string;
  email: string;
  
  // Lead capture fields
  fullName: string;
  phone: string;
  preferredContact: string;
  hearAboutUs: string;
  streetAddress: string;
  city: string;
  state: string;
  propertyType: string;
  interestType: string;
  needConsultation: boolean;
  isOwner: boolean;
  budgetRange: string;
  timelineToProceed: string;
  preferredContactTime: string;
  notes: string;
}

interface OnboardingProps {
  onComplete?: () => void;
}

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

export default function Onboarding({ onComplete }: OnboardingProps = {}) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = params.token;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHomeDetails, setShowHomeDetails] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    zip: '',
    home_type: '',
    sqft: '',
    hvac_type: '',
    water_heater: '',
    roof_age_years: '',
    email: '',
    fullName: '',
    phone: '',
    preferredContact: 'Email',
    hearAboutUs: '',
    streetAddress: '',
    city: '',
    state: '',
    propertyType: 'Residential',
    interestType: 'Sales',
    needConsultation: true,
    isOwner: true,
    budgetRange: '',
    timelineToProceed: '',
    preferredContactTime: '',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateRequiredFields = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) errors.fullName = "Name is required";
    if (!formData.phone.match(/^\+?[\d\s\-()]+$/) || formData.phone.length < 10) {
      errors.phone = "Valid phone number is required";
    }
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.streetAddress.trim()) errors.streetAddress = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.state.trim() || formData.state.length !== 2) errors.state = "Valid 2-letter state code required";
    if (!formData.zip.trim() || formData.zip.length < 5) errors.zip = "Valid ZIP code is required";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRequiredFields()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      setError('Invalid setup token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Submit original onboarding data
      const onboardingData: Record<string, string | boolean | number | undefined> = {
        token,
        zip: formData.zip,
      };
      
      if (formData.home_type) onboardingData.home_type = formData.home_type;
      if (formData.sqft) onboardingData.sqft = formData.sqft;
      if (formData.hvac_type) onboardingData.hvac_type = formData.hvac_type;
      if (formData.water_heater) onboardingData.water_heater = formData.water_heater;
      if (formData.roof_age_years) onboardingData.roof_age_years = formData.roof_age_years;
      if (formData.email) onboardingData.email = formData.email;

      const setupResponse = await fetch(`${API_BASE_URL}/api/setup/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData),
      });

      const setupResult = await setupResponse.json();
      
      if (!setupResponse.ok || !setupResult.success) {
        setError(setupResult.error || 'Setup activation failed');
        setLoading(false);
        return;
      }

      // 2. Submit lead capture data
      const leadData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        preferredContact: formData.preferredContact,
        hearAboutUs: formData.hearAboutUs,
        streetAddress: formData.streetAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        zipCode: formData.zip.trim(),
        propertyType: formData.propertyType,
        homeType: formData.home_type,
        interestType: formData.interestType,
        needConsultation: formData.needConsultation,
        isOwner: formData.isOwner,
        budgetRange: formData.budgetRange,
        timelineToProceed: formData.timelineToProceed,
        preferredContactTime: formData.preferredContactTime,
        notes: formData.notes,
        activationCode: token,
      };

      const leadResponse = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      const leadResult = await leadResponse.json();

      if (leadResponse.ok) {
        sessionStorage.setItem('setupResult', JSON.stringify(setupResult));
        toast({
          title: "Success!",
          description: "Your information has been saved.",
        });
        
        if (onComplete) {
          onComplete();
        } else {
          setLocation('/setup/success');
        }
      } else {
        setError(leadResult.error || 'Failed to save lead information');
      }

    } catch (err: unknown) {
      console.error('Setup error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Setup</h1>
            <p className="text-gray-600">Help us personalize your home maintenance experience</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Personal Detail */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <h2 className="text-xl font-semibold">Personal Detail</h2>
                <span className="ml-auto text-sm text-gray-500">* Required</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName">Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={validationErrors.fullName ? "border-red-500" : ""}
                  />
                  {validationErrors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={validationErrors.phone ? "border-red-500" : ""}
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className={validationErrors.email ? "border-red-500" : ""}
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                  <Select
                    name="preferredContact"
                    value={formData.preferredContact}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferredContact: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Phone">Phone</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferredContactTime">Preferred Contact Time</Label>
                  <Select
                    name="preferredContactTime"
                    value={formData.preferredContactTime}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferredContactTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                      <SelectItem value="Evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 2: Home Detail */}
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setShowHomeDetails(!showHomeDetails)}
                className="flex items-center gap-3 pb-3 border-b w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <h2 className="text-xl font-semibold">Home Detail</h2>
                <span className="ml-auto text-sm text-gray-500">* Required</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showHomeDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showHomeDetails && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="streetAddress">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        name="streetAddress"
                        required
                        value={formData.streetAddress}
                        onChange={handleInputChange}
                        className={validationErrors.streetAddress ? "border-red-500" : ""}
                      />
                      {validationErrors.streetAddress && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.streetAddress}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className={validationErrors.city ? "border-red-500" : ""}
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        required
                        maxLength={2}
                        placeholder="GA"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                        className={validationErrors.state ? "border-red-500" : ""}
                      />
                      {validationErrors.state && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input
                        id="zip"
                        name="zip"
                        required
                        value={formData.zip}
                        onChange={handleInputChange}
                        placeholder="30281"
                        className={validationErrors.zip ? "border-red-500" : ""}
                      />
                      {validationErrors.zip && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.zip}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="home_type">Home Type *</Label>
                      <Select
                        name="home_type"
                        value={formData.home_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, home_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select home type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single Family Home">Single Family Home</SelectItem>
                          <SelectItem value="Townhouse">Townhouse</SelectItem>
                          <SelectItem value="Condo">Condo</SelectItem>
                          <SelectItem value="Apartment">Apartment</SelectItem>
                          <SelectItem value="Duplex">Duplex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sqft">Square Footage</Label>
                      <Input
                        id="sqft"
                        name="sqft"
                        type="number"
                        value={formData.sqft}
                        onChange={handleInputChange}
                        placeholder="3000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="hvac_type">HVAC Type</Label>
                      <Select
                        name="hvac_type"
                        value={formData.hvac_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, hvac_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select HVAC type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Central Air & Heat">Central Air & Heat</SelectItem>
                          <SelectItem value="Heat Pump">Heat Pump</SelectItem>
                          <SelectItem value="Window Units">Window Units</SelectItem>
                          <SelectItem value="Ductless Mini-Split">Ductless Mini-Split</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="water_heater">Water Heater Type</Label>
                      <Select
                        name="water_heater"
                        value={formData.water_heater}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, water_heater: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select water heater" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Gas Tank">Gas Tank</SelectItem>
                          <SelectItem value="Gas Tankless">Gas Tankless</SelectItem>
                          <SelectItem value="Electric Tank">Electric Tank</SelectItem>
                          <SelectItem value="Hybrid Heat Pump">Hybrid Heat Pump</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="roof_age_years">Roof Age (Years)</Label>
                      <Input
                        id="roof_age_years"
                        name="roof_age_years"
                        type="number"
                        value={formData.roof_age_years}
                        onChange={handleInputChange}
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <Label>Are You the Owner?</Label>
                      <RadioGroup
                        value={formData.isOwner ? "Yes" : "No"}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, isOwner: value === "Yes" }))}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id="owner-yes" />
                          <Label htmlFor="owner-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id="owner-no" />
                          <Label htmlFor="owner-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Your Interest */}
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setShowInterests(!showInterests)}
                className="flex items-center gap-3 pb-3 border-b w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <h2 className="text-xl font-semibold">Your Interest</h2>
                <span className="text-sm text-gray-500">(Optional)</span>
                <svg
                  className={`ml-auto w-5 h-5 transition-transform ${showInterests ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showInterests && (
                <div className="space-y-6">
                  <div>
                    <Label>Interest Type *</Label>
                    <RadioGroup
                      value={formData.interestType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, interestType: value }))}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sales" id="sales" />
                        <Label htmlFor="sales">Sales</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Rent" id="rent" />
                        <Label htmlFor="rent">Rent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lease" id="lease" />
                        <Label htmlFor="lease">Lease</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Need Consultation?</Label>
                      <RadioGroup
                        value={formData.needConsultation ? "Yes" : "No"}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, needConsultation: value === "Yes" }))}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id="consult-yes" />
                          <Label htmlFor="consult-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id="consult-no" />
                          <Label htmlFor="consult-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="budgetRange">Budget Range</Label>
                      <Select
                        name="budgetRange"
                        value={formData.budgetRange}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, budgetRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$0-5K">$0–5K</SelectItem>
                          <SelectItem value="$5K-15K">$5K–15K</SelectItem>
                          <SelectItem value="$15K-30K">$15K–30K</SelectItem>
                          <SelectItem value="$30K+">$30K+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="timelineToProceed">Timeline to Proceed</Label>
                      <Select
                        name="timelineToProceed"
                        value={formData.timelineToProceed}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, timelineToProceed: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Immediately">Immediately</SelectItem>
                          <SelectItem value="Within 1 Month">Within 1 Month</SelectItem>
                          <SelectItem value="1-3 Months">1–3 Months</SelectItem>
                          <SelectItem value="Just Exploring">Just Exploring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes / Comments</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Tell us more about your needs..."
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Complete Setup'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
EOFFORM

# Check if file actually changed
if cmp -s "$FORM_FILE" "$NEW_FILE"; then
  log_warning "No changes detected - file content is identical"
  rm -f "$NEW_FILE"
  exit 0
fi

# Replace original with new file
if mv "$NEW_FILE" "$FORM_FILE"; then
  log_success "Form rearrangement complete!"
else
  log_error "Failed to replace original file"
  exit 1
fi

# === Summary Output ===
cat <<EOF

${GREEN}╔════════════════════════════════════════════════════════════════╗
║                    📋 Summary of Changes                       ║
╚════════════════════════════════════════════════════════════════╝${NC}

${BLUE}1️⃣  Personal Detail (Required)${NC}
   → Name, Phone, Email
   → Preferred Contact Method, Preferred Contact Time

${BLUE}2️⃣  Home Detail (Collapsible, Required)${NC}
   → Address, City, State, ZIP Code
   → Home Type, Square Footage
   → HVAC Type, Water Heater Type, Roof Age
   → Are You the Owner?

${BLUE}3️⃣  Your Interest (Collapsible, Optional)${NC}
   → Interest Type, Need Consultation?
   → Budget Range, Timeline to Proceed
   → Notes/Comments

${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

💾
Backup Location: ${YELLOW}${BACKUP_FILE}${NC}

${YELLOW}⚠️  Post-Implementation Checklist:${NC}
   ${GREEN}✓${NC} 1. Test all field validations
   ${GREEN}✓${NC} 2. Verify API submissions to /api/setup/activate & /api/leads
   ${GREEN}✓${NC} 3. Check required field indicators and error messages
   ${GREEN}✓${NC} 4. Test collapsible section toggles
   ${GREEN}✓${NC} 5. Run linting: ${BLUE}npm run lint${NC}
   ${GREEN}✓${NC} 6. Build and test: ${BLUE}npm run build && npm run dev${NC}

${YELLOW}🔄 Rollback Command:${NC}
   ${BLUE}cp "$BACKUP_FILE" "$FORM_FILE"${NC}

${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${GREEN}✨ Form rearrangement completed successfully!${NC}

EOF
