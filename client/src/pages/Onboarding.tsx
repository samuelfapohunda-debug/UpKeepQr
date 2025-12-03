import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { API_BASE_URL } from '@/lib/api-config';

interface OnboardingProps {
  adminMode?: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ adminMode = false }) => {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/setup/:token');
  const { user } = useAuth();
  
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Personal details
    fullName: '',
    phone: '',
    email: '',
    preferredContact: 'Email' as 'Email' | 'Phone' | 'SMS',  // Fixed: Capitalized
    preferredContactTime: '',
    hearAboutUs: '',
    smsOptIn: false,
    
    // Address
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    
    // Property details
    propertyType: 'residential' as 'residential' | 'commercial',
    home_type: '',
    sqft: '',
    interestType: 'Sales' as 'Sales' | 'Rent' | 'Lease',  // Fixed: Match backend
    needConsultation: false,
    isOwner: true,
    
    // Systems
    hvac_type: '',
    water_heater: '',
    roof_age_years: '',
    
    // Additional fields
    budgetRange: '',
    timelineToProceed: '',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(params?.token || null);
  const [showHomeDetails, setShowHomeDetails] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  
  // QR code one-time use enforcement
  const [customerDataLoaded, setCustomerDataLoaded] = useState(false);
  const [customerDataError, setCustomerDataError] = useState('');
  const [qrAlreadyActivated, setQrAlreadyActivated] = useState(false);

  useEffect(() => {
    // Skip token requirement if in admin mode
    if (adminMode) {
      setToken('admin-setup');
      return;
    }
    
    const setupToken = params?.token;
    if (!setupToken) {
      setError('Invalid setup link');
    } else {
      setToken(setupToken);
    }
  }, [params, adminMode]);

  // Fetch customer data to pre-fill form when coming from a QR code purchase
  useEffect(() => {
    const fetchCustomerData = async () => {
      // Skip pre-fill data fetch if in admin mode
      if (adminMode) {
        console.log('Admin mode: skipping customer data pre-fill');
        return;
      }
      
      if (!token) {
        console.log('No token provided');
        return;
      }
      
      try {
        console.log(`🔍 Fetching customer data for token: ${token}`);
        
        const response = await fetch(`${API_BASE_URL}/api/setup/${token}/customer-data`);
        
        if (!response.ok) {
          if (response.status === 409) {
            // QR code already activated
            const data = await response.json();
            setQrAlreadyActivated(true);
            setCustomerDataError(data.message || 'This QR code has already been activated.');
            
            // Show toast notification
            toast({
              variant: "destructive",
              title: "❌ Already Activated",
              description: data.message,
            });
            
            return;
          }
          
          throw new Error('Failed to fetch customer data');
        }
        
        const result = await response.json();
        
        if (result.alreadyActivated) {
          // Handle already activated state
          setQrAlreadyActivated(true);
          setCustomerDataError(result.message);
          
          toast({
            variant: "destructive",
            title: "❌ Already Activated",
            description: result.message,
          });
          
          return;
        }
        
        if (result.prefilled && result.data) {
          // Pre-fill form with customer data
          console.log('✅ Pre-filling form with customer data');
          
          setFormData(prev => ({
            ...prev,
            fullName: result.data.fullName || prev.fullName,
            email: result.data.email || prev.email,
            phone: result.data.phone || prev.phone,
            streetAddress: result.data.streetAddress || prev.streetAddress,
            city: result.data.city || prev.city,
            state: result.data.state || prev.state,
            zip: result.data.postalCode || prev.zip,
          }));
          
          setCustomerDataLoaded(true);
          
          // Show success notification
          toast({
            title: "✅ Welcome back!",
            description: "We've pre-filled your information. Please review and complete the form.",
          });
        } else {
          console.log('ℹ️  No customer data found - user will fill manually');
        }
        
      } catch (error) {
        console.error('Error fetching customer data:', error);
        // Fail silently - user can still fill form manually
        setCustomerDataError('Could not load your information. Please fill in the form manually.');
      }
    };
    
    fetchCustomerData();
  }, [token, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
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

    if (!token && !adminMode) {
      setError('Invalid setup token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (adminMode) {
        // ADMIN MODE: Direct household creation
        // Security: Backend derives admin mode from authentication, not from client flag
        const adminData = {
          skipWelcomeEmail: true, // Admin creation skips welcome email by default
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          zip: formData.zip.trim(),
          homeType: formData.home_type,
        };

        const response = await apiRequest("POST", "/api/setup/activate", adminData);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Household creation failed');
          toast({
            title: "Error",
            description: result.error || "Failed to create household.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Success!",
          description: "Household created successfully.",
        });

        setLocation('/admin/setup-forms');
      } else {
        // CUSTOMER MODE: Regular QR code activation
        // 1. Submit original onboarding data
        const onboardingData: Record<string, string | boolean | number | undefined> = {
          token,
          zip: formData.zip,
          smsOptIn: formData.smsOptIn,
        };

        if (formData.home_type) onboardingData.homeType = formData.home_type;
        if (formData.sqft) onboardingData.sqft = formData.sqft;
        if (formData.hvac_type) onboardingData.hvacType = formData.hvac_type;
        if (formData.water_heater) onboardingData.waterHeater = formData.water_heater;
        if (formData.roof_age_years) onboardingData.roofAgeYears = formData.roof_age_years;
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
          activationCode: token,  // Fixed: Added activationCode
          budgetRange: formData.budgetRange,
          timelineToProceed: formData.timelineToProceed,
          preferredContactTime: formData.preferredContactTime,
          notes: formData.notes,
        };

        const leadResponse = await fetch(`${API_BASE_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        });

        if (!leadResponse.ok) {
          console.error('Lead capture failed, but continuing...');
        }

        toast({
          title: "Success!",
          description: "Your home has been registered successfully.",
        });

        setLocation('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Admin Mode Badge */}
        {adminMode && (
          <Card className="mb-6 border-amber-500 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
                <CardTitle className="text-amber-900">Admin Mode - Manual Setup Creation</CardTitle>
              </div>
              <CardDescription className="text-amber-700">
                <div className="space-y-1">
                  <p>Creating household manually. No QR code activation required.</p>
                  <p className="text-xs">
                    📋 Total: 32 fields available | ⭐ Required: 8-9 fields (marked with *)
                  </p>
                </div>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {adminMode ? "Create New Household" : "Complete Your Home Setup"}
            </h1>
            <p className="mt-2 text-gray-600">
              {adminMode 
                ? "Enter customer information to create household record"
                : "Help us understand your home and needs better"
              }
            </p>
          </div>

          {/* Already Activated Warning */}
          {qrAlreadyActivated && (
            <div className="mb-6 p-6 bg-destructive/10 border-2 border-destructive rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-3xl">🔒</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-destructive mb-2">
                    QR Code Already Activated
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {customerDataError}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Each QR code can only be activated once for security reasons. 
                    If you need assistance, please contact support at{' '}
                    <a href="mailto:support@upkeepqr.com" className="text-primary underline">
                      support@upkeepqr.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`space-y-8 ${qrAlreadyActivated ? 'opacity-50 pointer-events-none' : ''}`}>
            
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
                    data-testid="input-phone"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="smsOptIn"
                      name="smsOptIn"
                      checked={formData.smsOptIn}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smsOptIn: checked as boolean }))}
                      data-testid="checkbox-sms-opt-in"
                    />
                    <div className="flex-1">
                      <Label htmlFor="smsOptIn" className="flex items-center gap-2 font-normal cursor-pointer">
                        <Smartphone className="w-4 h-4" />
                        <span className="text-sm text-muted-foreground">
                          I consent to receive maintenance reminders and updates via SMS. Standard message and data rates may apply. Reply STOP to opt out.
                        </span>
                      </Label>
                    </div>
                  </div>
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
                    onValueChange={(value) => handleSelectChange('preferredContact', value)}
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
                    onValueChange={(value) => handleSelectChange('preferredContactTime', value)}
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
                    placeholder="CA"
                    value={formData.state}
                    onChange={handleInputChange}
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
                    className={validationErrors.zip ? "border-red-500" : ""}
                  />
                  {validationErrors.zip && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.zip}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="hearAboutUs">How did you hear about us?</Label>
                  <Input
                    id="hearAboutUs"
                    name="hearAboutUs"
                    value={formData.hearAboutUs}
                    onChange={handleInputChange}
                  />
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
                <span className="ml-auto text-sm text-gray-500">Optional</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="home_type">Home Type</Label>
                    <Select
                      name="home_type"
                      value={formData.home_type}
                      onValueChange={(value) => handleSelectChange('home_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Family">Single Family</SelectItem>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                        <SelectItem value="Apartment">Apartment</SelectItem>
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
                    />
                  </div>

                  <div>
                    <Label htmlFor="hvac_type">HVAC Type</Label>
                    <Select
                      name="hvac_type"
                      value={formData.hvac_type}
                      onValueChange={(value) => handleSelectChange('hvac_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Central AC">Central AC</SelectItem>
                        <SelectItem value="Heat Pump">Heat Pump</SelectItem>
                        <SelectItem value="Window Units">Window Units</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="water_heater">Water Heater Type</Label>
                    <Select
                      name="water_heater"
                      value={formData.water_heater}
                      onValueChange={(value) => handleSelectChange('water_heater', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tank">Tank</SelectItem>
                        <SelectItem value="Tankless">Tankless</SelectItem>
                        <SelectItem value="Heat Pump">Heat Pump</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
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
                    />
                  </div>

                  <div>
                    <Label>Are you the homeowner?</Label>
                    <RadioGroup
                      value={formData.isOwner ? "Yes" : "No"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isOwner: value === "Yes" }))}
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
              )}
            </div>

            {/* Section 3: Interests & Needs */}
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setShowInterests(!showInterests)}
                className="flex items-center gap-3 pb-3 border-b w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <h2 className="text-xl font-semibold">Interests & Needs</h2>
                <span className="ml-auto text-sm text-gray-500">Optional</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showInterests ? 'rotate-180' : ''}`}
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
                    <Label>What are you interested in?</Label>
                    <RadioGroup
                      value={formData.interestType}
                      onValueChange={(value) => handleSelectChange('interestType', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sales" id="interest-sales" />
                        <Label htmlFor="interest-sales">Purchasing Products</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Rent" id="interest-rent" />
                        <Label htmlFor="interest-rent">Rental/Leasing</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lease" id="interest-lease" />
                        <Label htmlFor="interest-lease">Maintenance Services</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Would you like a consultation?</Label>
                    <RadioGroup
                      value={formData.needConsultation ? "Yes" : "No"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, needConsultation: value === "Yes" }))}
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
                      onValueChange={(value) => handleSelectChange('budgetRange', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-1k">Under $1,000</SelectItem>
                        <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                        <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                        <SelectItem value="over-10k">Over $10,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timelineToProceed">Timeline to Proceed</Label>
                    <Select
                      name="timelineToProceed"
                      value={formData.timelineToProceed}
                      onValueChange={(value) => handleSelectChange('timelineToProceed', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediately</SelectItem>
                        <SelectItem value="1-3months">1-3 Months</SelectItem>
                        <SelectItem value="3-6months">3-6 Months</SelectItem>
                        <SelectItem value="exploring">Just Exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Any specific concerns or requirements..."
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg"
              disabled={loading || qrAlreadyActivated}
              data-testid="button-submit-setup"
            >
              {qrAlreadyActivated ? '🔒 Already Activated' : (loading ? 'Submitting...' : 'Complete Setup')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
