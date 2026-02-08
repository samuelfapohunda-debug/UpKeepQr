import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, MapPin, Home as HomeIcon } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";

interface Step2Props {
  data: {
    email: string;
    name: string;
    zipCode: string;
    streetAddress?: string;
    city?: string;
    state?: string;
  };
  onNext: (data: {
    email: string;
    name: string;
    zipCode: string;
    streetAddress?: string;
    city?: string;
    state?: string;
  }) => void;
  onBack: () => void;
}

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  placePrediction: any;
}

const libraries: ("places")[] = ["places"];

export default function Step2Account({ data, onNext, onBack }: Step2Props) {
  const [email, setEmail] = useState(data.email);
  const [name, setName] = useState(data.name);
  const [zipCode, setZipCode] = useState(data.zipCode);
  const [streetAddress, setStreetAddress] = useState(data.streetAddress || "");
  const [city, setCity] = useState(data.city || "");
  const [state, setState] = useState(data.state || "");
  
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  
  const sessionTokenRef = useRef<any>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && apiKey) {
      google.maps.importLibrary('places').then(() => {
        if ((google.maps.places as any).AutocompleteSuggestion) {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
          setPlacesReady(true);
        } else {
          console.error("AutocompleteSuggestion API not available - check Places API (New) is enabled");
        }
      }).catch((error: any) => {
        console.error("Error loading Places library:", error);
      });
    }
  }, [isLoaded, apiKey]);

  const handleAddressChange = useCallback((value: string) => {
    setStreetAddress(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (value.length > 2 && placesReady) {
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const request: any = {
            input: value,
            includedRegionCodes: ['us', 'ca'],
            includedPrimaryTypes: ['street_address', 'subpremise', 'premise', 'route'],
            sessionToken: sessionTokenRef.current,
          };
          
          const { suggestions: results } = await (google.maps.places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          
          if (results && results.length > 0) {
            const mapped: SuggestionItem[] = results.map((s: any) => ({
              placeId: s.placePrediction.placeId,
              mainText: s.placePrediction.mainText?.text || '',
              secondaryText: s.placePrediction.secondaryText?.text || '',
              fullText: s.placePrediction.text?.text || '',
              placePrediction: s.placePrediction,
            }));
            setSuggestions(mapped);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error("Autocomplete error:", error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [placesReady]);

  const handleSelectSuggestion = useCallback(async (suggestion: SuggestionItem) => {
    setSuggestions([]);
    setShowSuggestions(false);
    
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['addressComponents', 'formattedAddress'],
      });
      
      let streetNumber = "";
      let route = "";
      let locality = "";
      let stateCode = "";
      let postalCode = "";

      if (place.addressComponents) {
        for (const component of place.addressComponents) {
          const types = component.types;
          if (types.includes("street_number")) {
            streetNumber = component.longText || "";
          }
          if (types.includes("route")) {
            route = component.longText || "";
          }
          if (types.includes("locality")) {
            locality = component.longText || "";
          }
          if (types.includes("sublocality_level_1") && !locality) {
            locality = component.longText || "";
          }
          if (types.includes("administrative_area_level_1")) {
            stateCode = component.shortText || "";
          }
          if (types.includes("postal_code")) {
            postalCode = component.longText || "";
          }
        }
      }

      const street = `${streetNumber} ${route}`.trim();
      setStreetAddress(street || suggestion.fullText);
      setCity(locality);
      setState(stateCode);
      if (postalCode) setZipCode(postalCode);

      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    } catch (error) {
      console.error("Place details error:", error);
      setStreetAddress(suggestion.fullText);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name && streetAddress && zipCode) {
      onNext({ email, name, zipCode, streetAddress, city, state });
    }
  };

  if (loadError) {
    return <div className="text-center text-red-600">Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-8 md:p-10">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Your Account</h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll use this to send your personalized maintenance schedule
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <Label htmlFor="email" className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Mail className="h-4 w-4" />
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            required
            data-testid="input-email"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            We'll send your schedule and reminders here
          </p>
        </div>

        {/* Full Name */}
        <div>
          <Label htmlFor="name" className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <User className="h-4 w-4" />
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            required
            data-testid="input-name"
          />
        </div>

        {/* Street Address with Autocomplete */}
        <div className="relative">
          <Label htmlFor="address" className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <HomeIcon className="h-4 w-4" />
            Street Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            type="text"
            value={streetAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            required
            data-testid="input-street-address"
          />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.placeId}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                  data-testid={`suggestion-${index}`}
                >
                  <div className="text-sm font-medium">
                    {suggestion.mainText}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {suggestion.secondaryText}
                  </div>
                </div>
              ))}
              <div className="px-4 py-2 text-xs text-gray-400 border-t bg-gray-50 dark:bg-gray-900">
                Powered by Google
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Start typing for suggestions (US & Canada)
          </p>
        </div>

        {/* City and State (auto-filled) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">City</Label>
            <Input
              id="city"
              type="text"
              value={city}
              placeholder="Auto-fills from address"
              readOnly
              className="h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-500 cursor-not-allowed"
              data-testid="input-city"
            />
          </div>
          <div>
            <Label htmlFor="state" className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">State / Province</Label>
            <Input
              id="state"
              type="text"
              value={state}
              placeholder="Auto-fills from address"
              readOnly
              className="h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-500 cursor-not-allowed"
              data-testid="input-state"
            />
          </div>
        </div>

        {/* ZIP Code */}
        <div>
          <Label htmlFor="zipCode" className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <MapPin className="h-4 w-4" />
            ZIP / Postal Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="zipCode"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            required
            maxLength={10}
            data-testid="input-zip-code"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            For weather-based reminders and local service matching
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12"
            data-testid="button-back"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            disabled={!email || !name || !streetAddress || !zipCode}
            data-testid="button-submit-step2"
          >
            Generate My Schedule
          </Button>
        </div>
      </form>
    </div>
  );
}
