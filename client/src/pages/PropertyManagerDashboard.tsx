import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import { useLoadScript } from "@react-google-maps/api";
import {
  Building2,
  Plus,
  Upload,
  RefreshCw,
  LogOut,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Download,
  X,
  MapPin,
  ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ManagedProperty {
  id: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unitNumber: string | null;
  propertyType: string;
  activationStatus: string;
  scheduleGenerated: boolean;
  yearBuilt: number | null;
  squareFootage: number | null;
  createdAt: string;
}

interface BulkUploadJob {
  id: number;
  status: string;
  totalProperties: number;
  processed: number;
  successful: number;
  failed: number;
  errorLog: string | null;
  completedAt: string | null;
}

interface Household {
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
}

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  placePrediction: any;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending:  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const PLACES_LIBRARIES: ("places")[] = ["places"];

const CSV_TEMPLATE =
  `property_name,address,city,state,zip,unit_number,property_type\n` +
  `123 Oak Street,123 Oak St,Austin,TX,78701,,single_family\n` +
  `Riverfront Condos,456 River Rd,Austin,TX,78702,Unit 4A,condo\n`;

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "portfolio_upload_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Add Property Modal ─────────────────────────────────────────────────────

interface AddPropertyModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddPropertyModal({ onClose, onSaved }: AddPropertyModalProps) {
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

  // Google Places
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

  const handleSelectSuggestion = useCallback(async (suggestion: SuggestionItem) => {
    setSuggestions([]);
    setShowSuggestions(false);
    try {
      const place = suggestion.placePrediction.toPlace();
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
        address: `${streetNum} ${route}`.trim() || suggestion.fullText,
        city: locality,
        state: stateCode,
        zip: postal || f.zip,
      }));
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    } catch {
      setForm(f => ({ ...f, address: suggestion.fullText }));
    }
  }, []);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

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
      if (!res.ok) throw new Error(data.error || "Failed to add property");
      toast({ title: "Property added", description: "AI schedule generating in the background." });
      onSaved();
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
              <Label htmlFor="pm-propertyName">Property Name *</Label>
              <Input
                id="pm-propertyName"
                required
                value={form.propertyName}
                onChange={set("propertyName")}
                placeholder="e.g. 123 Oak Street"
              />
            </div>

            {/* Street Address with Google Places */}
            <div className="space-y-2 relative">
              <Label htmlFor="pm-address">Street Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pm-address"
                  required
                  value={form.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="123 Oak Street"
                  className="pl-9"
                />
              </div>
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
                      <div className="text-xs text-muted-foreground">{suggestion.secondaryText}</div>
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
                <Label htmlFor="pm-city">City *</Label>
                <Input
                  id="pm-city"
                  required
                  value={form.city}
                  onChange={set("city")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pm-state">State *</Label>
                <Input
                  id="pm-state"
                  required
                  value={form.state}
                  onChange={set("state")}
                  maxLength={2}
                  placeholder="TX"
                />
              </div>
            </div>

            {/* ZIP / Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pm-zip">ZIP *</Label>
                <Input
                  id="pm-zip"
                  required
                  value={form.zip}
                  onChange={set("zip")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pm-unit">Unit # <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="pm-unit"
                  value={form.unitNumber}
                  onChange={set("unitNumber")}
                  placeholder="e.g. 4A"
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select
                value={form.propertyType}
                onValueChange={(v) => setForm(f => ({ ...f, propertyType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  "Add Property"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Bulk Upload Modal ──────────────────────────────────────────────────────

interface BulkUploadModalProps {
  onClose: () => void;
  onJobStarted: (jobId: number) => void;
}

function BulkUploadModal({ onClose, onJobStarted }: BulkUploadModalProps) {
  const { toast } = useToast();
  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvText.trim()) {
      toast({ title: "No CSV selected", description: "Please choose a CSV file first.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/bulk-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast({ title: "Upload started", description: `Processing ${data.totalProperties} properties in the background.` });
      onJobStarted(data.jobId);
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const rowCount = csvText ? csvText.trim().split("\n").length - 1 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Bulk Upload Properties</CardTitle>
            <CardDescription>Upload a CSV file to add multiple properties at once.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Column guide */}
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p className="font-medium mb-1">Required CSV columns:</p>
            <code className="text-xs text-muted-foreground">property_name, address, city, state, zip</code>
            <p className="mt-1 text-xs text-muted-foreground">Optional: unit_number, property_type</p>
          </div>

          {/* Template download */}
          <Button variant="outline" size="sm" onClick={downloadCsvTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          {/* File upload — matches RequestPro photo upload pattern */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            {csvText ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ {rowCount} {rowCount === 1 ? "row" : "rows"} ready to upload
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">Drop your CSV file here or click to browse</p>
            )}
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 text-sm">
                {csvText ? "Choose a different file" : "Upload CSV file"}
              </span>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} className="flex-1" disabled={uploading || !csvText}>
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
              ) : (
                "Upload & Process"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Job Status Banner ──────────────────────────────────────────────────────

function JobStatusBanner({ jobId, onDone }: { jobId: number; onDone: () => void }) {
  const { data: job } = useQuery<BulkUploadJob>({
    queryKey: ["/api/portfolio/bulk-upload", jobId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/bulk-upload/${jobId}`, {
        credentials: "include",
      });
      return res.json();
    },
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 2000 : false),
  });

  useEffect(() => {
    if (job?.status === "completed" || job?.status === "failed") {
      onDone();
    }
  }, [job?.status, onDone]);

  if (!job || job.status === "completed" || job.status === "failed") return null;

  const pct = job.totalProperties > 0
    ? Math.round((job.processed / job.totalProperties) * 100)
    : 0;

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium text-blue-800 dark:text-blue-200">Bulk upload in progress</span>
        <span className="text-blue-600 dark:text-blue-400 ml-2">
          {job.processed}/{job.totalProperties} properties ({pct}%)
        </span>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function PropertyManagerDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);

  // Session verification
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/session/verify`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.valid) { setSessionValid(true); return; }
        }
        navigate("/");
      } catch {
        navigate("/");
      } finally {
        setIsVerifying(false);
      }
    })();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/session/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { /* ignore */ }
    navigate("/");
  };

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] });
    queryClient.invalidateQueries({ queryKey: ["/api/customer/household"] });
    toast({ title: "Refreshed", description: "Portfolio data updated" });
  }, [queryClient, toast]);

  // Household (for name in header)
  const { data: household } = useQuery<Household>({
    queryKey: ["/api/customer/household"],
    enabled: sessionValid,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/customer/household`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch household");
      return res.json();
    },
  });

  const { data: properties = [], isLoading } = useQuery<ManagedProperty[]>({
    queryKey: ["/api/portfolio/properties"],
    enabled: sessionValid,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] });
      toast({ title: "Property removed" });
    },
    onError: () =>
      toast({ title: "Error", description: "Could not remove property", variant: "destructive" }),
  });

  const handleJobDone = useCallback(() => {
    setActiveJobId(null);
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] });
    toast({ title: "Bulk upload complete", description: "Your portfolio has been updated." });
  }, [queryClient, toast]);

  // Stats
  const total     = properties.length;
  const active    = properties.filter(p => p.activationStatus === "active").length;
  const pending   = properties.filter(p => p.activationStatus === "pending").length;
  const scheduled = properties.filter(p => p.scheduleGenerated).length;

  // ── Loading / gate states ────────────────────────────────────────────────

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>You're not signed in</CardTitle>
            <CardDescription>
              Sign in to access your property management dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/login")} className="w-full">Sign In</Button>
            <Button variant="outline" onClick={() => navigate("/pricing")} className="w-full">View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header — matches CustomerDashboard blue/indigo gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">
                  Welcome, {household?.firstName || "Manager"}!
                </h1>
                <p className="text-blue-100 text-sm">
                  Property Manager · {total}/200 properties
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleRefresh} data-testid="button-refresh">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-white/10 border-white/20 text-white"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* Job status banner */}
        {activeJobId && (
          <JobStatusBanner jobId={activeJobId} onDone={handleJobDone} />
        )}

        {/* Stats — match CustomerDashboard card pattern exactly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card data-testid="stat-total">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Properties</p>
                  <p className="text-xl sm:text-2xl font-bold">{total}</p>
                </div>
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{active}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{pending}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-scheduled">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">AI Scheduled</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{scheduled}</p>
                </div>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Portfolio Properties
                </CardTitle>
                <CardDescription>
                  Manage your properties and AI maintenance schedules
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  disabled={total >= 200}
                  data-testid="button-bulk-upload"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  disabled={total >= 200}
                  data-testid="button-add-property"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No properties yet</p>
                <p className="text-sm mb-6">
                  Add your first property or bulk upload from a CSV file.
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Button size="sm" onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/property-manager/${p.id}`)}
                    data-testid={`property-${p.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium truncate">{p.propertyName}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${STATUS_COLORS[p.activationStatus] ?? ""}`}
                        >
                          {p.activationStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.address}{p.unitNumber ? ` · ${p.unitNumber}` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{p.city}, {p.state} {p.zip}</span>
                        <span className="capitalize">{p.propertyType.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-muted-foreground">AI Schedule</p>
                        {p.scheduleGenerated ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Generated
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-500 text-sm">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/property-manager/${p.id}`);
                        }}
                        data-testid={`button-view-${p.id}`}
                      >
                        View <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove "${p.propertyName}"?`)) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        data-testid={`button-delete-${p.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {total >= 200 && (
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-lg px-4 py-3 text-sm border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Portfolio limit of 200 properties reached.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] })}
        />
      )}
      {showUploadModal && (
        <BulkUploadModal
          onClose={() => setShowUploadModal(false)}
          onJobStarted={(id) => setActiveJobId(id)}
        />
      )}
    </div>
  );
}
