import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import { useLoadScript } from "@react-google-maps/api";
import {
  Users, Plus, RefreshCw, LogOut, Loader2, CheckCircle2,
  Clock, Mail, X, MapPin, Send, ChevronRight, AlertTriangle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface RealtorClient {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  propertyType: string;
  activationStatus: string;
  activationEmailSentAt: string | null;
  activatedAt: string | null;
  clientHouseholdId: string | null;
  createdAt: string;
}

interface Summary {
  total_clients: number;
  active: number;
  pending: number;
  email_sent: number;
  remaining_slots: number;
}

interface Household { firstName?: string }

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  placePrediction: any;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  activated:  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  email_sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  pending:    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  inactive:   "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  activated:  "Activated",
  email_sent: "Email Sent",
  pending:    "Pending",
  inactive:   "Inactive",
};

const PLACES_LIBRARIES: ("places")[] = ["places"];

// ── Add Client Modal ───────────────────────────────────────────────────────

interface AddClientModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddClientModal({ onClose, onSaved }: AddClientModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    property_address: "",
    property_city: "",
    property_state: "",
    property_zip: "",
    property_type: "single_family",
  });

  const placesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";
  const { isLoaded: placesLoaded } = useLoadScript({ googleMapsApiKey: placesApiKey, libraries: PLACES_LIBRARIES });
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
    setForm(f => ({ ...f, property_address: value }));
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
        } catch { setSuggestions([]); setShowSuggestions(false); }
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
        property_address: `${streetNum} ${route}`.trim() || s.fullText,
        property_city: locality,
        property_state: stateCode,
        property_zip: postal || f.property_zip,
      }));
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    } catch {
      setForm(f => ({ ...f, property_address: s.fullText }));
    }
  }, []);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/realtor/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, client_phone: form.client_phone || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add client");
      toast({ title: "Client added", description: "Invitation email sent to client." });
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add client",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-xl my-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Add Client</CardTitle>
            <CardDescription>An invitation email will be sent automatically.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="rc-name">Client Name *</Label>
                <Input id="rc-name" required value={form.client_name} onChange={set("client_name")} placeholder="Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-email">Client Email *</Label>
                <Input id="rc-email" type="email" required value={form.client_email} onChange={set("client_email")} placeholder="jane@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="rc-phone" value={form.client_phone} onChange={set("client_phone")} placeholder="+1 555 000 0000" />
              </div>
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="rc-address">Property Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rc-address"
                  required
                  value={form.property_address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="123 Oak Street"
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
                    >
                      <div className="text-sm font-medium">{s.mainText}</div>
                      <div className="text-xs text-muted-foreground">{s.secondaryText}</div>
                    </div>
                  ))}
                  <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/50">Powered by Google</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label htmlFor="rc-city">City *</Label>
                <Input id="rc-city" required value={form.property_city} onChange={set("property_city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-state">State *</Label>
                <Input id="rc-state" required value={form.property_state} onChange={set("property_state")} maxLength={2} placeholder="TX" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rc-zip">ZIP *</Label>
                <Input id="rc-zip" required value={form.property_zip} onChange={set("property_zip")} />
              </div>
              <div className="space-y-2">
                <Label>Property Type *</Label>
                <Select value={form.property_type} onValueChange={(v) => setForm(f => ({ ...f, property_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_family">Single Family</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Add Client & Send Invitation</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function RealtorDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/session/verify`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.valid) { setSessionValid(true); return; }
        }
        navigate("/");
      } catch { navigate("/"); }
      finally { setIsVerifying(false); }
    })();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/session/logout`, { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    navigate("/");
  };

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/realtor/clients"] });
    queryClient.invalidateQueries({ queryKey: ["/api/realtor/summary"] });
    toast({ title: "Refreshed" });
  }, [queryClient, toast]);

  const { data: household } = useQuery<Household>({
    queryKey: ["/api/customer/household"],
    enabled: sessionValid,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/customer/household`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch household");
      return res.json();
    },
  });

  const { data: summary } = useQuery<Summary>({
    queryKey: ["/api/realtor/summary"],
    enabled: sessionValid,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/realtor/summary`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: clients = [], isLoading } = useQuery<RealtorClient[]>({
    queryKey: ["/api/realtor/clients"],
    enabled: sessionValid,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/realtor/clients`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/realtor/clients/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to remove client");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/realtor/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/realtor/summary"] });
      toast({ title: "Client removed" });
    },
    onError: () => toast({ title: "Error", description: "Could not remove client", variant: "destructive" }),
  });

  const resendMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/realtor/clients/${id}/resend-email`, {
        method: "POST", credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any).error || "Failed to resend");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/realtor/clients"] });
      toast({ title: "Invitation resent" });
    },
    onError: (err: unknown) => toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to resend",
      variant: "destructive",
    }),
  });

  const visibleClients = clients.filter(c => c.activationStatus !== 'inactive');
  const total = summary?.total_clients ?? visibleClients.length;

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
            <CardTitle>Dashboard Access Required</CardTitle>
            <CardDescription>Please use the link from your email to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">
                  Welcome, {household?.firstName || "Agent"}!
                </h1>
                <p className="text-blue-100 text-sm">
                  Realtor / Agent · {total}/25 clients
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />Refresh
              </Button>
              <Button
                variant="outline" size="sm" onClick={handleLogout}
                className="bg-white/10 border-white/20 text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-xl sm:text-2xl font-bold">{summary?.total_clients ?? 0}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{summary?.active ?? 0}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600">{summary?.pending ?? 0}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Email Sent</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{summary?.email_sent ?? 0}</p>
                </div>
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{summary?.remaining_slots ?? 25}</p>
                </div>
                <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Portfolio
                </CardTitle>
                <CardDescription>
                  Manage your clients and their maintenance schedules
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                disabled={total >= 25}
                data-testid="button-add-client"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : visibleClients.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No clients yet</p>
                <p className="text-sm mb-6">Add your first client to send an invitation and generate their AI maintenance schedule.</p>
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Client
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleClients.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    data-testid={`client-${c.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium truncate">{c.clientName}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${STATUS_COLORS[c.activationStatus] ?? ""}`}
                        >
                          {STATUS_LABELS[c.activationStatus] ?? c.activationStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.clientEmail}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{c.propertyAddress}, {c.propertyCity}, {c.propertyState} {c.propertyZip}</span>
                        <span className="capitalize">{c.propertyType.replace(/_/g, " ")}</span>
                      </div>
                      {c.activatedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Activated {new Date(c.activatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {c.activationStatus !== 'activated' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendMutation.mutate(c.id)}
                          disabled={resendMutation.isPending}
                          data-testid={`button-resend-${c.id}`}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Resend
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => {
                          if (confirm(`Remove ${c.clientName}?`)) deleteMutation.mutate(c.id);
                        }}
                        data-testid={`button-delete-${c.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {total >= 25 && (
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-lg px-4 py-3 text-sm border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Client limit of 25 reached.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/realtor/clients"] });
            queryClient.invalidateQueries({ queryKey: ["/api/realtor/summary"] });
          }}
        />
      )}
    </div>
  );
}
