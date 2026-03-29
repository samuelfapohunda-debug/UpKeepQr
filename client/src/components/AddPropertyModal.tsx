import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import type { ManagedProperty } from "@/types/dashboard";

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  placePrediction: any;
}

const PLACES_LIBRARIES: ("places")[] = ["places"];

interface Props {
  onClose: () => void;
  onAdded: (property: ManagedProperty) => void;
}

export default function AddPropertyModal({ onClose, onAdded }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    propertyName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    propertyType: "single_family",
    yearBuilt: "",
    squareFootage: "",
    bedrooms: "",
    bathrooms: "",
    purchaseDate: "",
    purchasePrice: "",
    notes: "",
  });

  const placesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";
  const { isLoaded: placesLoaded } = useLoadScript({
    googleMapsApiKey: placesApiKey,
    libraries: PLACES_LIBRARIES,
  });
  const [placesReady, setPlacesReady] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (placesLoaded && placesApiKey) {
      google.maps.importLibrary("places").then(() => {
        if ((google.maps.places as any).AutocompleteSuggestion) {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
          setPlacesReady(true);
        }
      }).catch(console.error);
    }
  }, [placesLoaded, placesApiKey]);

  const handleAddressChange = useCallback((value: string) => {
    setForm(f => ({ ...f, address: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length > 2 && placesReady) {
      debounceRef.current = setTimeout(async () => {
        try {
          const req: any = {
            input: value,
            includedRegionCodes: ["us", "ca"],
            includedPrimaryTypes: ["street_address", "subpremise", "premise", "route"],
            sessionToken: sessionTokenRef.current,
          };
          const { suggestions: results } = await (google.maps.places as any)
            .AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
          if (results?.length > 0) {
            setSuggestions(results.map((s: any) => ({
              placeId: s.placePrediction.placeId,
              mainText: s.placePrediction.mainText?.text || "",
              secondaryText: s.placePrediction.secondaryText?.text || "",
              fullText: s.placePrediction.text?.text || "",
              placePrediction: s.placePrediction,
            })));
            setShowSuggestions(true);
          } else {
            setSuggestions([]); setShowSuggestions(false);
          }
        } catch {
          setSuggestions([]); setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]); setShowSuggestions(false);
    }
  }, [placesReady]);

  const handleSelectSuggestion = useCallback(async (s: SuggestionItem) => {
    setSuggestions([]); setShowSuggestions(false);
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
      let streetNum = "", route = "", locality = "", stateCode = "", postal = "";
      for (const c of place.addressComponents ?? []) {
        if (c.types.includes("street_number")) streetNum = c.longText || "";
        if (c.types.includes("route")) route = c.longText || "";
        if (c.types.includes("locality")) locality = c.longText || "";
        if (c.types.includes("sublocality_level_1") && !locality) locality = c.longText || "";
        if (c.types.includes("administrative_area_level_1")) stateCode = c.shortText || "";
        if (c.types.includes("postal_code")) postal = c.longText || "";
      }
      setForm(f => ({
        ...f,
        address: `${streetNum} ${route}`.trim() || s.fullText,
        city: locality,
        state: stateCode,
        zip: postal || f.zip,
      }));
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    } catch {
      setForm(f => ({ ...f, address: s.fullText }));
    }
  }, []);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          propertyName: form.propertyName,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          propertyType: form.propertyType,
          yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : null,
          squareFootage: form.squareFootage ? parseInt(form.squareFootage) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || data.error || "Failed to add property";
        throw new Error(msg);
      }
      toast({ title: "Property added", description: "AI maintenance schedule is generating in the background." });
      onAdded(data as ManagedProperty);
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add property",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-2xl">Add New Property</DialogTitle>
          <DialogDescription>
            Enter the property details below to add it to your portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {/* Section 1: Property Information */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Property Information
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Enter the basic details of your property
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="ap-propertyName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Property Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ap-propertyName"
                  required
                  value={form.propertyName}
                  onChange={set("propertyName")}
                  placeholder="e.g. Beach House, Rental #2"
                  className="bg-white dark:bg-gray-800 h-12"
                />
              </div>

              <div>
                <Label htmlFor="ap-propertyType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.propertyType}
                  onValueChange={(v) => setForm(f => ({ ...f, propertyType: v }))}
                >
                  <SelectTrigger id="ap-propertyType" className="bg-white dark:bg-gray-800 h-12">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_family">Single Family</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="multi_family">Multi-Family</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address — full width with Google Places autocomplete */}
              <div className="md:col-span-2 relative">
                <Label htmlFor="ap-address" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ap-address"
                    required
                    value={form.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="123 Main St"
                    className="pl-9 bg-white dark:bg-gray-800 h-12"
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, i) => (
                      <div
                        key={s.placeId}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                        onMouseDown={() => handleSelectSuggestion(s)}
                        data-testid={`suggestion-${i}`}
                      >
                        <div className="text-sm font-medium">{s.mainText}</div>
                        <div className="text-xs text-muted-foreground">{s.secondaryText}</div>
                      </div>
                    ))}
                    <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/50">
                      Powered by Google
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Start typing for suggestions (US &amp; Canada)
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Property Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Property Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Additional details about your property
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="ap-yearBuilt" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Year Built
                </Label>
                <Input
                  id="ap-yearBuilt"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={form.yearBuilt}
                  onChange={set("yearBuilt")}
                  placeholder="e.g. 1998"
                  className="bg-white dark:bg-gray-800 h-12"
                />
              </div>

              <div>
                <Label htmlFor="ap-squareFootage" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Square Footage
                </Label>
                <Input
                  id="ap-squareFootage"
                  type="number"
                  min="1"
                  value={form.squareFootage}
                  onChange={set("squareFootage")}
                  placeholder="e.g. 2200"
                  className="bg-white dark:bg-gray-800 h-12"
                />
              </div>

              <div>
                <Label htmlFor="ap-bedrooms" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Bedrooms
                </Label>
                <Input
                  id="ap-bedrooms"
                  type="number"
                  min="0"
                  max="20"
                  value={form.bedrooms}
                  onChange={set("bedrooms")}
                  placeholder="e.g. 3"
                  className="bg-white dark:bg-gray-800 h-12"
                />
              </div>

              <div>
                <Label htmlFor="ap-bathrooms" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Bathrooms
                </Label>
                <Input
                  id="ap-bathrooms"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={form.bathrooms}
                  onChange={set("bathrooms")}
                  placeholder="e.g. 2"
                  className="bg-white dark:bg-gray-800 h-12"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ownership Information */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Ownership Information
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Record ownership and purchase details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="ap-purchaseDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Purchase Date
                </Label>
                <Input
                  id="ap-purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={set("purchaseDate")}
                  className="bg-white dark:bg-gray-800 h-12"
                />
              </div>

              <div>
                <Label htmlFor="ap-purchasePrice" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Purchase Price ($)
                </Label>
                <Input
                  id="ap-purchasePrice"
                  type="number"
                  min="0"
                  step="1"
                  value={form.purchasePrice}
                  onChange={set("purchasePrice")}
                  placeholder="e.g. 350000"
                  className="bg-white dark:bg-gray-800 h-12"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="ap-notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes{" "}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="ap-notes"
                  value={form.notes}
                  onChange={set("notes")}
                  rows={3}
                  placeholder="Additional information about this property..."
                  className="bg-white dark:bg-gray-800 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="px-6"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="px-6">
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                : "Add Property"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
