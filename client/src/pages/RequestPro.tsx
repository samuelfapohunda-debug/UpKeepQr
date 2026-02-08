import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { useLoadScript } from "@react-google-maps/api";

// Form validation schema
const requestProSchema = z.object({
  contactName: z.string().min(1, "Name is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().min(1, "Phone number is required"),
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']),
  urgency: z.enum(['emergency', '24h', '3days', 'flexible']),
  description: z.string().min(10, "Please provide at least 10 characters describing your needs"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  preferredWindows: z.string().optional(),
});

type RequestProForm = z.infer<typeof requestProSchema>;

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  placePrediction: any;
}

const libraries: ("places")[] = ["places"];

export default function RequestPro() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string>("");
  const { toast } = useToast();
  
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  
  const sessionTokenRef = useRef<any>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";
  
  const { isLoaded } = useLoadScript({
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

  const form = useForm<RequestProForm>({
    resolver: zodResolver(requestProSchema),
    defaultValues: {
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      trade: undefined,
      urgency: undefined,
      description: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      preferredWindows: "",
    },
  });

  const submitRequest = useMutation({
    mutationFn: async (data: RequestProForm & { photos: string[] }) => {
      const response = await fetch(`${API_BASE_URL}/api/pro-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit request");
      }
      
      return response.json();
    },
    onSuccess: (result: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setIsSubmitted(true);
      setTrackingCode(result.publicTrackingCode);
      toast({
        title: "Request Submitted Successfully!",
        description: "You'll receive a confirmation email shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (photos.length + files.length > 5) {
      toast({
        title: "Too Many Photos",
        description: "You can upload a maximum of 5 photos.",
        variant: "destructive",
      });
      return;
    }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddressChange = (value: string) => {
    form.setValue('addressLine1', value);
    
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
  };

  const handleSelectSuggestion = async (suggestion: SuggestionItem) => {
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
      form.setValue('addressLine1', street || suggestion.fullText);
      form.setValue('city', locality);
      form.setValue('state', stateCode);
      if (postalCode) form.setValue('zip', postalCode);

      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    } catch (error) {
      console.error("Place details error:", error);
      form.setValue('addressLine1', suggestion.fullText);
    }
  };

  const onSubmit = async (data: RequestProForm) => {
    try {
      // For now, we'll use empty array for photos since we haven't implemented file upload to cloud storage
      // In a production app, you'd upload photos to Cloudinary or similar service first
      const photosUrls: string[] = [];
      
      await submitRequest.mutateAsync({ ...data, photos: photosUrls });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Request Submitted Successfully!</CardTitle>
              <CardDescription className="text-lg">
                Your service request has been submitted and you'll receive a confirmation email shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-700">Your Tracking Code:</p>
                <p className="text-2xl font-mono text-blue-600 mt-1" data-testid="tracking-code">{trackingCode}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Save this code to track your request status
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <p>What happens next:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>We'll match you with qualified professionals in your area</li>
                  <li>You'll receive email updates as your request progresses</li>
                  <li>A service provider will contact you to schedule the work</li>
                </ol>
              </div>
              <Button 
                onClick={() => {setIsSubmitted(false); form.reset(); setPhotos([]); setTrackingCode("");}} 
                variant="outline"
                data-testid="button-submit-another"
              >
                Submit Another Request
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20">
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Request a Professional Service</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with qualified local professionals for your home maintenance and repair needs. 
            Fill out the form below and we'll match you with the right expert.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Request Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us match you with the right professional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service Address</h3>
                  
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem className="relative">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            data-testid="input-address"
                          />
                        </FormControl>
                        
                        {/* Google Places Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
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
                        
                        <p className="text-sm text-gray-600 mt-1">
                          Start typing for suggestions (US & Canada)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apt, Suite, etc. (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={2} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={5} data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-trade">
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="roofing">Roofing</SelectItem>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="hvac">HVAC</SelectItem>
                              <SelectItem value="general">General Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-urgency">
                              <SelectValue placeholder="When do you need this done?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="emergency">Emergency (ASAP)</SelectItem>
                              <SelectItem value="24h">Within 24 hours</SelectItem>
                              <SelectItem value="3days">Within 3 days</SelectItem>
                              <SelectItem value="flexible">Flexible timing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Describe Your Service Needs</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4}
                            placeholder="Please describe what work needs to be done, any specific issues, and any other details that would help a professional prepare for the job..."
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredWindows"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Time Windows (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Weekdays after 3pm, Weekends only, etc."
                            data-testid="input-preferred-windows"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Photos (Optional)</h3>
                  <p className="text-sm text-gray-600">Upload up to 5 photos to help professionals understand your needs</p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500">Upload photos</span>
                      <Input
                        id="photo-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        data-testid="input-photos"
                      />
                    </Label>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB each</p>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            data-testid={`button-remove-photo-${index}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-6">
                  <Button 
                    type="submit" 
                    className="min-w-[200px]"
                    disabled={submitRequest.isPending}
                    data-testid="button-submit-request"
                  >
                    {submitRequest.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>You'll receive a confirmation email after submitting</span>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}