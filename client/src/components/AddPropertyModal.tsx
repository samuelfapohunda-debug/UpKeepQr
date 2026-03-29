import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, X } from "lucide-react";
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
    unitNumber: "",
    propertyType: "single_family",
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
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, unitNumber: form.unitNumber || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Surface clear messages for limit errors
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Add Property</CardTitle>
            <CardDescription>AI maintenance schedule generates automatically after saving.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property Name */}
            <div className="space-y-2">
              <Label htmlFor="ap-propertyName">Property Name *</Label>
              <Input
                id="ap-propertyName"
                required
                value={form.propertyName}
                onChange={set("propertyName")}
                placeholder="e.g. Beach House, Rental #2"
              />
            </div>

            {/* Street Address with Google Places */}
            <div className="space-y-2 relative">
              <Label htmlFor="ap-address">Street Address *</Label>
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
                  className="pl-9"
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
              <p className="text-xs text-muted-foreground">Start typing for suggestions (US &amp; Canada)</p>
            </div>

            {/* City / State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="ap-city">City *</Label>
                <Input id="ap-city" required value={form.city} onChange={set("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-state">State *</Label>
                <Input id="ap-state" required value={form.state} onChange={set("state")} maxLength={2} placeholder="TX" />
              </div>
            </div>

            {/* ZIP / Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ap-zip">ZIP *</Label>
                <Input id="ap-zip" required value={form.zip} onChange={set("zip")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-unit">Unit # <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="ap-unit" value={form.unitNumber} onChange={set("unitNumber")} placeholder="e.g. 4A" />
              </div>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select value={form.propertyType} onValueChange={(v) => setForm(f => ({ ...f, propertyType: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="multi_family">Multi-Family</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Add Property"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
