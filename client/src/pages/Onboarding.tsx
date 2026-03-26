import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, ShieldCheck, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { API_BASE_URL } from '@/lib/api-config';
import { useLoadScript } from '@react-google-maps/api';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';

interface OnboardingProps {
  adminMode?: boolean;
  onComplete?: () => void;
}

interface AttomSummary {
  homeType: string | null;
  squareFootage: number | null;
  yearBuilt: number | null;
  city: string | null;
  state: string | null;
}

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  placePrediction: any;
}

const libraries: ('places')[] = ['places'];

const HOME_TYPE_DISPLAY: Record<string, string> = {
  'Single Family': 'Single Family',
  'Condo': 'Condo',
  'Townhouse': 'Townhouse',
  'mobile': 'Mobile Home',
  'Apartment': 'Apartment',
};

const Onboarding: React.FC<OnboardingProps> = ({ adminMode = false, onComplete }) => {
  const [, setLocation] = useLocation();
  const params = useParams<{ token: string }>();
  const { isCustomer } = useAuth();

  const { toast } = useToast();

  // --- Step navigation ---
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // --- Form data ---
  const [formData, setFormData] = useState({
    // Account (Step 3)
    fullName: '',
    phone: '',
    email: '',
    preferredContact: 'Email' as 'Email' | 'Phone' | 'SMS',
    preferredContactTime: '',
    hearAboutUs: '',
    smsOptIn: false,
    // Address (Step 1)
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    propertyType: 'residential' as 'residential' | 'commercial',
    // Home details (Step 2)
    home_type: '',
    sqft: '',
    yearBuilt: '',
    bedrooms: '',
    bathrooms: '',
    hvac_type: '',
    heatPump: '',
    water_heater: '',
    roof_age_years: '',
    hasPool: false,
    garage: false,
    // Kept for payload compatibility (not shown in UI)
    isOwner: true,
    interestType: 'Sales' as 'Sales' | 'Rent' | 'Lease',
    needConsultation: false,
    budgetRange: '',
    timelineToProceed: '',
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Token / QR ---
  const [token, setToken] = useState<string | null>(null);
  const [customerDataError, setCustomerDataError] = useState('');
  const [qrAlreadyActivated, setQrAlreadyActivated] = useState(false);

  // --- Realtor client flow ---
  const [realtorClientId, setRealtorClientId] = useState<string | null>(null);
  const [realtorName, setRealtorName] = useState<string | null>(null);

  // --- ATTOM ---
  const [attomLoading, setAttomLoading] = useState(false);
  const [attomFound, setAttomFound] = useState<boolean | null>(null);
  const [attomSummary, setAttomSummary] = useState<AttomSummary | null>(null);
  const attomDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Google Places ---
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  const sessionTokenRef = useRef<any>(null);
  const placesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
  const { isLoaded: placesLoaded } = useLoadScript({
    googleMapsApiKey: placesApiKey,
    libraries,
  });

  // Init Places session token
  useEffect(() => {
    if (placesLoaded && placesApiKey) {
      google.maps.importLibrary('places').then(() => {
        if ((google.maps.places as any).AutocompleteSuggestion) {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
          setPlacesReady(true);
        }
      }).catch(console.error);
    }
  }, [placesLoaded, placesApiKey]);

  // Token init — only validate if a token is present in the URL
  useEffect(() => {
    if (adminMode) {
      setToken('admin-setup');
      return;
    }
    const setupToken = params?.token;
    if (setupToken) {
      setToken(setupToken);
      return;
    }
    // Check for realtor client invitation
    const urlParams = new URLSearchParams(window.location.search);
    const rcId = urlParams.get('realtorClient');
    if (rcId) {
      setRealtorClientId(rcId);
    }
    // No token = direct /onboarding access — skip validation entirely
  }, [params?.token, adminMode]);

  // Pre-fill from realtor client invitation
  useEffect(() => {
    if (!realtorClientId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/realtor/activate/${realtorClientId}`);
        if (!res.ok) {
          if (res.status === 409) {
            setQrAlreadyActivated(true);
            setCustomerDataError('This invitation has already been used.');
            return;
          }
          throw new Error('Failed to fetch invitation');
        }
        const data = await res.json();
        setRealtorName(data.realtorName ?? null);
        setFormData(prev => ({
          ...prev,
          fullName:      data.clientName    || prev.fullName,
          email:         data.clientEmail   || prev.email,
          phone:         data.clientPhone   || prev.phone,
          streetAddress: data.propertyAddress || prev.streetAddress,
          city:          data.propertyCity   || prev.city,
          state:         data.propertyState  || prev.state,
          zip:           data.propertyZip    || prev.zip,
        }));
        toast({ title: `Invitation from ${data.realtorName}`, description: "We've pre-filled your property details. Complete setup to activate your schedule." });
      } catch {
        setCustomerDataError('Could not load invitation. Please fill in the form manually.');
      }
    })();
  }, [realtorClientId, toast]);

  // Pre-fill from QR purchase customer data
  useEffect(() => {
    if (adminMode || !token || token === 'admin-setup') return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/setup/${token}/customer-data`);
        if (!res.ok) {
          if (res.status === 409) {
            const d = await res.json();
            setQrAlreadyActivated(true);
            setCustomerDataError(d.message || 'This QR code has already been activated.');
            toast({ variant: 'destructive', title: '❌ Already Activated', description: d.message });
            return;
          }
          throw new Error('Failed to fetch customer data');
        }
        const result = await res.json();
        if (result.alreadyActivated) {
          setQrAlreadyActivated(true);
          setCustomerDataError(result.message);
          toast({ variant: 'destructive', title: '❌ Already Activated', description: result.message });
          return;
        }
        if (result.prefilled && result.data) {
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
          toast({ title: '✅ Welcome back!', description: "We've pre-filled your information. Please review and complete the form." });
        }
      } catch {
        setCustomerDataError('Could not load your information. Please fill in the form manually.');
      }
    })();
  }, [token, adminMode, toast]);

  // ATTOM lookup — fires on Step 1 when both street + zip are non-empty (debounced 600ms)
  useEffect(() => {
    if (step !== 1) return;
    if (!formData.streetAddress.trim() || !formData.zip.trim()) return;

    if (attomDebounceRef.current) clearTimeout(attomDebounceRef.current);
    attomDebounceRef.current = setTimeout(async () => {
      setAttomLoading(true);
      setAttomFound(null);
      try {
        const qs = new URLSearchParams({
          streetAddress: formData.streetAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim(),
        });
        const res = await fetch(`${API_BASE_URL}/api/property/lookup?${qs}`);
        const data = await res.json();

        if (!data.found) {
          setAttomFound(false);
          return;
        }

        const homeTypeMap: Record<string, string> = {
          single_family: 'Single Family',
          condo: 'Condo',
          townhouse: 'Townhouse',
          mobile: 'mobile',
        };
        const hvacTypeMap: Record<string, string> = {
          central_air: 'Central AC',
          heat_pump: 'Heat Pump',
          window_unit: 'Window Units',
          none: 'None',
        };

        setFormData(prev => ({
          ...prev,
          ...(data.homeType && homeTypeMap[data.homeType] ? { home_type: homeTypeMap[data.homeType] } : {}),
          ...(data.squareFootage ? { sqft: String(data.squareFootage) } : {}),
          ...(data.yearBuilt ? { yearBuilt: String(data.yearBuilt) } : {}),
          ...(data.bedrooms ? { bedrooms: String(data.bedrooms) } : {}),
          ...(data.bathrooms ? { bathrooms: String(data.bathrooms) } : {}),
          ...(data.hvacType && hvacTypeMap[data.hvacType] ? { hvac_type: hvacTypeMap[data.hvacType] } : {}),
          hasPool: data.hasPool ?? prev.hasPool,
          garage: data.garage ?? prev.garage,
        }));

        setAttomSummary({
          homeType: data.homeType ? (homeTypeMap[data.homeType] || null) : null,
          squareFootage: data.squareFootage ?? null,
          yearBuilt: data.yearBuilt ?? null,
          city: formData.city || null,
          state: formData.state || null,
        });
        setAttomFound(true);
      } catch {
        setAttomFound(false);
      } finally {
        setAttomLoading(false);
      }
    }, 600);

    return () => {
      if (attomDebounceRef.current) clearTimeout(attomDebounceRef.current);
    };
  }, [formData.streetAddress, formData.zip, step]);

  // Google Places: address typing → suggestions
  const handleAddressChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, streetAddress: value }));
    if (placesDebounceRef.current) clearTimeout(placesDebounceRef.current);
    if (value.length > 2 && placesReady) {
      placesDebounceRef.current = setTimeout(async () => {
        try {
          const req: any = {
            input: value,
            includedRegionCodes: ['us', 'ca'],
            includedPrimaryTypes: ['street_address', 'subpremise', 'premise', 'route'],
            sessionToken: sessionTokenRef.current,
          };
          const { suggestions: results } = await (google.maps.places as any)
            .AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
          if (results?.length > 0) {
            setSuggestions(results.map((s: any) => ({
              placeId: s.placePrediction.placeId,
              mainText: s.placePrediction.mainText?.text || '',
              secondaryText: s.placePrediction.secondaryText?.text || '',
              fullText: s.placePrediction.text?.text || '',
              placePrediction: s.placePrediction,
            })));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [placesReady]);

  // Google Places: user selects a suggestion → auto-fill city/state/zip
  const handleSelectSuggestion = useCallback(async (suggestion: SuggestionItem) => {
    setSuggestions([]);
    setShowSuggestions(false);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });
      let streetNum = '', route = '', locality = '', stateCode = '', postal = '';
      for (const c of place.addressComponents ?? []) {
        if (c.types.includes('street_number')) streetNum = c.longText || '';
        if (c.types.includes('route')) route = c.longText || '';
        if (c.types.includes('locality')) locality = c.longText || '';
        if (c.types.includes('sublocality_level_1') && !locality) locality = c.longText || '';
        if (c.types.includes('administrative_area_level_1')) stateCode = c.shortText || '';
        if (c.types.includes('postal_code')) postal = c.longText || '';
      }
      setFormData(prev => ({
        ...prev,
        streetAddress: `${streetNum} ${route}`.trim() || suggestion.fullText,
        city: locality,
        state: stateCode,
        zip: postal || prev.zip,
      }));
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    } catch {
      setFormData(prev => ({ ...prev, streetAddress: suggestion.fullText }));
    }
  }, []);

  // Generic handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validation
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.streetAddress.trim()) e.streetAddress = 'Street address is required';
    if (!formData.city.trim()) e.city = 'City is required';
    if (!formData.state.trim()) e.state = 'State / Province is required';
    if (!formData.zip.trim() || formData.zip.length < 5) e.zip = 'Valid ZIP code is required';
    setValidationErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = 'Name is required';
    if (!formData.phone.match(/^\+?[\d\s\-()]+$/) || formData.phone.length < 10) {
      e.phone = 'Valid phone number is required';
    }
    if (!formData.email.trim()) e.email = 'Email is required';
    setValidationErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep1Continue = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (!token && !adminMode && !realtorClientId && !isCustomer) {
      // Not logged in, no QR token, no realtor invite — direct to paid signup
      setLocation('/pricing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!token && !adminMode && !realtorClientId && isCustomer) {
        // Logged-in subscriber setting up their home profile for the first time
        const payload: Record<string, string | boolean | number | undefined> = {
          streetAddress: formData.streetAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim().toUpperCase(),
          zip: formData.zip.trim(),
          fullName: formData.fullName.trim(),
          phone: formData.phone,
          smsOptIn: formData.smsOptIn,
        };
        if (formData.home_type) payload.homeType = formData.home_type;
        if (formData.sqft) payload.sqft = parseInt(formData.sqft);
        if (formData.yearBuilt) payload.yearBuilt = parseInt(formData.yearBuilt);
        if (formData.bedrooms) payload.bedrooms = parseInt(formData.bedrooms);
        if (formData.bathrooms) payload.bathrooms = parseFloat(formData.bathrooms);
        if (formData.hvac_type) payload.hvacType = formData.hvac_type;
        if (formData.water_heater) payload.waterHeater = formData.water_heater;
        if (formData.roof_age_years) payload.roofAgeYears = parseInt(formData.roof_age_years);
        if (formData.isOwner !== undefined) payload.isOwner = formData.isOwner;
        if (formData.hasPool) payload.hasPool = formData.hasPool;
        if (formData.garage) payload.garage = formData.garage;

        const res = await fetch(`${API_BASE_URL}/api/customer/setup-home`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          setError(result.error || 'Failed to save home profile');
          setLoading(false);
          return;
        }

        toast({ title: 'Home profile saved!', description: 'Your maintenance schedule is being generated.' });
        onComplete?.();
        setLocation('/my-home');
        return;
      } else if (adminMode) {
        const adminData: Record<string, string | boolean | number | undefined> = {
          skipWelcomeEmail: true,
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          streetAddress: formData.streetAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim().toUpperCase(),
          zip: formData.zip.trim(),
          smsOptIn: formData.smsOptIn,
        };

        if (formData.home_type) adminData.homeType = formData.home_type;
        if (formData.sqft) adminData.sqft = parseInt(formData.sqft);
        if (formData.yearBuilt) adminData.yearBuilt = parseInt(formData.yearBuilt);
        if (formData.bedrooms) adminData.bedrooms = parseInt(formData.bedrooms);
        if (formData.bathrooms) adminData.bathrooms = parseFloat(formData.bathrooms);
        if (formData.hvac_type) adminData.hvacType = formData.hvac_type;
        if (formData.heatPump) adminData.heatPump = formData.heatPump;
        if (formData.water_heater) adminData.waterHeater = formData.water_heater;
        if (formData.roof_age_years) adminData.roofAgeYears = parseInt(formData.roof_age_years);
        if (formData.isOwner !== undefined) adminData.isOwner = formData.isOwner;
        if (formData.hasPool) adminData.hasPool = formData.hasPool;
        if (formData.garage) adminData.garage = formData.garage;
        if (formData.notes) adminData.notes = formData.notes;

        const response = await apiRequest('POST', '/api/setup/activate', adminData);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Household creation failed');
          toast({ title: 'Error', description: result.error || 'Failed to create household.', variant: 'destructive' });
          setLoading(false);
          return;
        }

        toast({ title: 'Success!', description: 'Household created successfully.' });
        onComplete?.();
        setLocation('/admin/setup-forms');
      } else if (realtorClientId) {
        // Realtor client activation flow — no QR token needed
        const realtorPayload = {
          fullName:      formData.fullName.trim(),
          email:         formData.email.trim().toLowerCase(),
          phone:         formData.phone,
          streetAddress: formData.streetAddress.trim(),
          city:          formData.city.trim(),
          state:         formData.state.trim().toUpperCase(),
          zip:           formData.zip.trim(),
        };

        const realtorRes = await fetch(`${API_BASE_URL}/api/realtor/activate/${realtorClientId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(realtorPayload),
        });
        const realtorResult = await realtorRes.json();

        if (!realtorRes.ok || !realtorResult.success) {
          setError(realtorResult.error || 'Setup failed');
          setLoading(false);
          return;
        }

        toast({ title: 'Account created!', description: 'Check your email for a link to access your dashboard.' });
        setLocation('/check-email');
      } else {
        const onboardingData: Record<string, string | boolean | number | undefined> = {
          token: token ?? undefined,
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          streetAddress: formData.streetAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim().toUpperCase(),
          zip: formData.zip,
          smsOptIn: formData.smsOptIn,
        };

        if (formData.home_type) onboardingData.homeType = formData.home_type;
        if (formData.sqft) onboardingData.sqft = parseInt(formData.sqft);
        if (formData.yearBuilt) onboardingData.yearBuilt = parseInt(formData.yearBuilt);
        if (formData.bedrooms) onboardingData.bedrooms = parseInt(formData.bedrooms);
        if (formData.bathrooms) onboardingData.bathrooms = parseFloat(formData.bathrooms);
        if (formData.hvac_type) onboardingData.hvacType = formData.hvac_type;
        if (formData.heatPump) onboardingData.heatPump = formData.heatPump;
        if (formData.water_heater) onboardingData.waterHeater = formData.water_heater;
        if (formData.roof_age_years) onboardingData.roofAgeYears = parseInt(formData.roof_age_years);
        if (formData.isOwner !== undefined) onboardingData.isOwner = formData.isOwner;
        if (formData.hasPool) onboardingData.hasPool = formData.hasPool;
        if (formData.garage) onboardingData.garage = formData.garage;
        if (formData.notes) onboardingData.notes = formData.notes;

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
          activationCode: token,
          budgetRange: formData.budgetRange,
          timelineToProceed: formData.timelineToProceed,
          preferredContactTime: formData.preferredContactTime,
          notes: formData.notes,
        };

        await fetch(`${API_BASE_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        }).catch(() => console.error('Lead capture failed, but continuing...'));

        toast({ title: 'Success!', description: 'Your home has been registered successfully.' });
        onComplete?.();
        setLocation('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({ title: 'Error', description: 'Failed to complete setup. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ATTOM confirmation card (Step 1)
  const renderAttomCard = () => {
    if (attomLoading) {
      return (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
          <p className="text-sm text-blue-800">Looking up your property...</p>
        </div>
      );
    }

    if (attomFound === true && attomSummary) {
      const parts: string[] = [];
      if (attomSummary.homeType) parts.push(HOME_TYPE_DISPLAY[attomSummary.homeType] || attomSummary.homeType);
      if (attomSummary.squareFootage) parts.push(`${attomSummary.squareFootage.toLocaleString()} sqft`);
      if (attomSummary.yearBuilt) parts.push(`Built ${attomSummary.yearBuilt}`);
      const location = [attomSummary.city, attomSummary.state].filter(Boolean).join(', ');

      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-semibold text-green-900">We found your home</p>
              {parts.length > 0 && (
                <p className="text-sm text-green-800">{parts.join(' · ')}</p>
              )}
              {location && <p className="text-sm text-green-700">{location}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleStep1Continue}
              data-testid="button-looks-right"
            >
              Looks right →
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleStep1Continue}
              data-testid="button-edit-details"
            >
              Edit details →
            </Button>
          </div>
        </div>
      );
    }

    if (attomFound === false) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            We couldn't find your property automatically. You'll fill in the details on the next step.
          </p>
        </div>
      );
    }

    return null;
  };

  // Per-step card title and description
  const stepTitle = step === 1 ? 'Your Address' : step === 2 ? 'Confirm Your Home' : 'Account Setup';
  const stepDesc =
    step === 1
      ? 'Start with your property address'
      : step === 2
      ? attomFound === true
        ? 'Review the details we found — update anything that looks off'
        : 'Tell us a bit about your home for a better schedule'
      : 'Almost done — just a few details';

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Page title — outside the card */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {adminMode ? 'Create New Household' : 'Set Up Your Home'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {adminMode
              ? 'Admin mode — manual household creation without QR code activation.'
              : "Tell us about your property and we'll build a personalized maintenance schedule."}
          </p>
        </div>

        {/* Realtor invitation banner */}
        {realtorClientId && realtorName && (
          <Card className="mb-6 border-blue-400 bg-blue-50 dark:bg-blue-950">
            <CardHeader className="py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900 dark:text-blue-100 text-base">
                  Invitation from {realtorName}
                </CardTitle>
              </div>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Your property details have been pre-filled. Complete the form to activate your personalized maintenance schedule.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Admin Mode Badge */}
        {adminMode && (
          <Card className="mb-6 border-amber-500 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
                <CardTitle className="text-amber-900">Admin Mode - Manual Setup Creation</CardTitle>
              </div>
              <CardDescription className="text-amber-700">
                Creating household manually. No QR code activation required.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <ProgressIndicator
              currentStep={step}
              totalSteps={3}
              stepLabels={['Your Address', 'Your Home', 'Account Setup']}
            />
            <CardTitle>{stepTitle}</CardTitle>
            <CardDescription>{stepDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* QR already activated warning */}
            {qrAlreadyActivated && (
              <div className="p-6 bg-destructive/10 border-2 border-destructive rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🔒</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-destructive mb-2">QR Code Already Activated</h2>
                    <p className="text-muted-foreground mb-4">{customerDataError}</p>
                    <p className="text-sm text-muted-foreground">
                      Each QR code can only be activated once for security reasons. Contact{' '}
                      <a href="mailto:support@maintcue.com" className="text-primary underline">
                        support@maintcue.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className={qrAlreadyActivated ? 'opacity-50 pointer-events-none' : ''}>

              {/* ========== STEP 1: YOUR ADDRESS ========== */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Address</h3>

                  {/* Street Address with Places autocomplete */}
                  <div className="relative">
                    <Label htmlFor="streetAddress">Street Address *</Label>
                    <Input
                      id="streetAddress"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="123 Main St"
                      className={validationErrors.streetAddress ? 'border-red-500' : ''}
                      data-testid="input-street-address"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.placeId}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                            onMouseDown={() => handleSelectSuggestion(suggestion)}
                            data-testid={`suggestion-${index}`}
                          >
                            <div className="text-sm font-medium">{suggestion.mainText}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{suggestion.secondaryText}</div>
                          </div>
                        ))}
                        <div className="px-4 py-2 text-xs text-gray-400 border-t bg-gray-50 dark:bg-gray-900">
                          Powered by Google
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Start typing for suggestions (US &amp; Canada)
                    </p>
                    {validationErrors.streetAddress && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.streetAddress}</p>
                    )}
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Auto-fills from address"
                        className={validationErrors.city ? 'border-red-500' : ''}
                        data-testid="input-city"
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="state">State / Province *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Auto-fills from address"
                        maxLength={3}
                        className={validationErrors.state ? 'border-red-500' : ''}
                        data-testid="input-state"
                      />
                      {validationErrors.state && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                      )}
                    </div>
                  </div>

                  {/* ZIP */}
                  <div>
                    <Label htmlFor="zip" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      ZIP / Postal Code *
                    </Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      maxLength={10}
                      className={validationErrors.zip ? 'border-red-500' : ''}
                      data-testid="input-zip"
                    />
                    {validationErrors.zip && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.zip}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      For weather-based reminders and local service matching
                    </p>
                  </div>

                  {/* ATTOM result */}
                  {renderAttomCard()}

                  {/* Continue — hidden while loading or when ATTOM found (card has its own CTAs) */}
                  {!attomLoading && attomFound !== true && (
                    <Button
                      type="button"
                      className="w-full sm:min-w-[200px] sm:w-auto"
                      onClick={handleStep1Continue}
                      data-testid="button-step1-continue"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              )}

              {/* ========== STEP 2: CONFIRM YOUR HOME ========== */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Home Details</h3>

                  {attomFound === true && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        We pre-filled your home details from public records. Please confirm or update below.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="mobile">Mobile Home</SelectItem>
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
                        data-testid="input-sqft"
                      />
                    </div>

                    <div>
                      <Label htmlFor="yearBuilt">Year Built</Label>
                      <Input
                        id="yearBuilt"
                        name="yearBuilt"
                        type="number"
                        placeholder="e.g., 1995"
                        min="1800"
                        max={new Date().getFullYear()}
                        value={formData.yearBuilt}
                        onChange={handleInputChange}
                        data-testid="input-year-built"
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
                        <SelectTrigger data-testid="select-water-heater">
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

                    <div className="flex items-center gap-3 pt-2">
                      <Checkbox
                        id="hasPool"
                        checked={formData.hasPool}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, hasPool: checked as boolean }))
                        }
                      />
                      <Label htmlFor="hasPool" className="font-normal cursor-pointer">
                        Has a pool
                      </Label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Checkbox
                        id="garage"
                        checked={formData.garage}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, garage: checked as boolean }))
                        }
                      />
                      <Label htmlFor="garage" className="font-normal cursor-pointer">
                        Has a garage
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                      data-testid="button-step2-back"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => setStep(3)}
                      data-testid="button-step2-continue"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* ========== STEP 3: ACCOUNT SETUP ========== */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>

                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={validationErrors.fullName ? 'border-red-500' : ''}
                    />
                    {validationErrors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
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
                      className={validationErrors.email ? 'border-red-500' : ''}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
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
                      className={validationErrors.phone ? 'border-red-500' : ''}
                      data-testid="input-phone"
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="smsOptIn"
                      checked={formData.smsOptIn}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, smsOptIn: checked as boolean }))
                      }
                      data-testid="checkbox-sms-opt-in"
                    />
                    <Label htmlFor="smsOptIn" className="flex items-center gap-2 font-normal cursor-pointer">
                      <Smartphone className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">
                        I consent to receive maintenance reminders and updates via SMS. Standard message
                        and data rates may apply. Reply STOP to opt out.
                      </span>
                    </Label>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(2)}
                      data-testid="button-step3-back"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={loading || qrAlreadyActivated}
                      data-testid="button-submit-setup"
                    >
                      {qrAlreadyActivated
                        ? '🔒 Already Activated'
                        : loading
                        ? 'Submitting...'
                        : 'Complete Setup'}
                    </Button>
                  </div>
                </form>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
