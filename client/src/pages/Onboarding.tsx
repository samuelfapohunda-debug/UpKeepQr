import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

export default function Onboarding({ onComplete }: OnboardingProps = {}) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = params.token;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showLeadFields, setShowLeadFields] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    // Original fields
    zip: '',
    home_type: '',
    sqft: '',
    hvac_type: '',
    water_heater: '',
    roof_age_years: '',
    email: '',
    
    // Lead fields
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

  const validateLeadFields = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) errors.fullName = "Name is required";
    if (!formData.phone.match(/^\+?[\d\s\-()]+$/) || formData.phone.length < 10) {
      errors.phone = "Valid phone number is required";
    }
    if (!formData.streetAddress.trim()) errors.streetAddress = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.state.trim()) errors.state = "State is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLeadFields()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required lead capture fields",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Setup</h1>
            <p className="mt-2 text-gray-600">Setup Token: {token}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <h2 className="text-xl font-semibold">Basic Information</h2>
                <span className="ml-auto text-sm text-gray-500">* Required</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    name="zip"
                    required
                    value={formData.zip}
                    onChange={handleInputChange}
                    placeholder="30281"
                  />
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

                <div className="md:col-span-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">We'll send you maintenance reminders and tips</p>
                </div>
              </div>
            </div>

            {/* Section 2: Additional Details (Optional) */}
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="flex items-center gap-3 pb-3 border-b w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <h2 className="text-xl font-semibold">Additional Details</h2>
                <span className="text-sm text-gray-500">(Optional)</span>
                <svg
                  className={`ml-auto w-5 h-5 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showOptionalFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              )}
            </div>

            {/* Section 3: Lead Capture Information */}
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setShowLeadFields(!showLeadFields)}
                className="flex items-center gap-3 pb-3 border-b w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <h2 className="text-xl font-semibold">Contact & Property Details</h2>
                <span className="ml-auto text-sm text-gray-500">* Required</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showLeadFields ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showLeadFields && (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="fullName">Full Name *</Label>
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

                    <div className="md:col-span-2">
                      <Label htmlFor="hearAboutUs">How did you hear about us?</Label>
                      <Select
                        name="hearAboutUs"
                        value={formData.hearAboutUs}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, hearAboutUs: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="QR Scan">QR Scan</SelectItem>
                          <SelectItem value="Social Media">Social Media</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Property Location */}
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Property Location</h3>
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
                    </div>
                  </div>

                  {/* Your Interests */}
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Your Interests</h3>
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

                        <div>
                          <Label htmlFor="budgetRange">Budget Range (Optional)</Label>
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
