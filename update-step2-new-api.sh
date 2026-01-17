#!/bin/bash

echo "========================================="
echo "🔧 Updating to New Google Places API"
echo "========================================="
echo ""

# Backup
cp client/src/components/onboarding/Step2Account.tsx client/src/components/onboarding/Step2Account.tsx.backup-before-new-api

# Create the updated version with new API
cat > client/src/components/onboarding/Step2Account.tsx << 'COMPONENT'
import { useState, useEffect, useRef } from "react";
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

const libraries: ("places")[] = ["places"];

export default function Step2Account({ data, onNext, onBack }: Step2Props) {
  const [email, setEmail] = useState(data.email);
  const [name, setName] = useState(data.name);
  const [zipCode, setZipCode] = useState(data.zipCode);
  const [streetAddress, setStreetAddress] = useState(data.streetAddress || "");
  const [city, setCity] = useState(data.city || "");
  const [state, setState] = useState(data.state || "");

  const addressContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Initialize new PlaceAutocompleteElement
  useEffect(() => {
    if (isLoaded && addressContainerRef.current && !autocompleteElementRef.current && apiKey) {
      try {
        // Create the new Place Autocomplete Element
        const options = {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        };

        // @ts-ignore - New API might not have types yet
        const autocompleteElement = new google.maps.places.PlaceAutocompleteElement(options);
        
        // Add to DOM
        addressContainerRef.current.appendChild(autocompleteElement);
        autocompleteElementRef.current = autocompleteElement;

        // Listen for place selection
        autocompleteElement.addEventListener('gmp-placeselect', async (event: any) => {
          const place = event.place;
          
          if (place && place.addressComponents) {
            let streetNumber = "";
            let route = "";
            let locality = "";
            let stateCode = "";
            let postalCode = "";

            place.addressComponents.forEach((component: any) => {
              const types = component.types;
              if (types.includes("street_number")) {
                streetNumber = component.longText;
              }
              if (types.includes("route")) {
                route = component.longText;
              }
              if (types.includes("locality")) {
                locality = component.longText;
              }
              if (types.includes("administrative_area_level_1")) {
                stateCode = component.shortText;
              }
              if (types.includes("postal_code")) {
                postalCode = component.longText;
              }
            });

            const street = `${streetNumber} ${route}`.trim();
            setStreetAddress(street);
            setCity(locality);
            setState(stateCode);
            if (postalCode) setZipCode(postalCode);
          }
        });
      } catch (error) {
        console.error("Error initializing Place Autocomplete:", error);
      }
    }

    return () => {
      if (autocompleteElementRef.current && addressContainerRef.current) {
        try {
          addressContainerRef.current.removeChild(autocompleteElementRef.current);
          autocompleteElementRef.current = null;
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
    };
  }, [isLoaded, apiKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name && zipCode) {
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
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
        <p className="text-muted-foreground">
          We'll use this to send your personalized maintenance schedule
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <Label htmlFor="email" className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4" />
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            We'll send your schedule and reminders here
          </p>
        </div>

        {/* Full Name */}
        <div>
          <Label htmlFor="name" className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            required
          />
        </div>

        {/* Street Address with new Autocomplete */}
        <div>
          <Label htmlFor="address" className="flex items-center gap-2 mb-2">
            <HomeIcon className="h-4 w-4" />
            Street Address (Optional)
          </Label>
          <div ref={addressContainerRef} className="mb-2" />
          <Input
            id="manual-address"
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Or enter manually"
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Start typing your address for suggestions
          </p>
        </div>

        {/* City and State (auto-filled) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Auto-fills from address"
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Auto-fills from address"
              readOnly
            />
          </div>
        </div>

        {/* ZIP Code */}
        <div>
          <Label htmlFor="zipCode" className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            ZIP Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="zipCode"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="12345"
            required
            maxLength={5}
          />
          <p className="text-sm text-muted-foreground mt-1">
            For weather-based reminders and local service matching
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            ← Back
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!email || !name || !zipCode}
          >
            Generate My Schedule →
          </Button>
        </div>
      </form>
    </div>
  );
}
COMPONENT

echo "✅ Updated Step2Account.tsx with new Google Places API"
echo ""
echo "Changes made:"
echo "  • Replaced deprecated Autocomplete with PlaceAutocompleteElement"
echo "  • Updated event listeners for new API"
echo "  • Changed address_components to addressComponents"
echo "  • Changed long_name/short_name to longText/shortText"
echo ""
echo "Next: Deploy to production"
