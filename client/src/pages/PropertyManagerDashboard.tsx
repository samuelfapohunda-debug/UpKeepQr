import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
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

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:  "bg-green-100 text-green-800",
  pending: "bg-blue-100 text-blue-800",
  inactive:"bg-gray-100 text-gray-700",
};

const CSV_TEMPLATE = `property_name,address,city,state,zip,unit_number,property_type
123 Oak Street,123 Oak St,Austin,TX,78701,,single_family
Riverfront Condos,456 River Rd,Austin,TX,78702,Unit 4A,condo
`;

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
  const [form, setForm] = useState({
    propertyName: "", address: "", city: "", state: "", zip: "",
    unitNumber: "", propertyType: "single_family",
  });
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
      if (!res.ok) throw new Error(data.error || "Failed to add property");
      toast({ title: "Property added", description: "AI schedule generating in the background." });
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to add property", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
              <input required value={form.propertyName} onChange={set("propertyName")}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 123 Oak Street" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input required value={form.address} onChange={set("address")}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 123 Oak Street" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input required value={form.city} onChange={set("city")}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input required value={form.state} onChange={set("state")} maxLength={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="TX" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                <input required value={form.zip} onChange={set("zip")}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit #</label>
                <input value={form.unitNumber} onChange={set("unitNumber")}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="optional" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
              <select value={form.propertyType} onChange={set("propertyType")}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="single_family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="apartment">Apartment</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500">AI maintenance schedule will generate automatically after saving.</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Add Property"}
            </Button>
          </div>
        </form>
      </div>
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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvText.trim()) {
      toast({ title: "No CSV", description: "Select a CSV file first", variant: "destructive" });
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
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Bulk Upload Properties</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Required CSV columns:</p>
            <code className="text-xs">property_name, address, city, state, zip</code>
            <p className="mt-1 text-xs text-blue-600">Optional: unit_number, property_type</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadCsvTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Download CSV Template
          </Button>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">Drop your CSV file here or click to browse</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose File</Button>
            {csvText && (
              <p className="mt-2 text-xs text-emerald-600 font-medium">
                ✓ File loaded ({csvText.split('\n').length - 1} data rows)
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={uploading || !csvText}>
              {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : "Upload & Process"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Job Status Banner ──────────────────────────────────────────────────────

function JobStatusBanner({ jobId, onDone }: { jobId: number; onDone: () => void }) {
  const { data: job } = useQuery<BulkUploadJob>({
    queryKey: ['/api/portfolio/bulk-upload', jobId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/bulk-upload/${jobId}`, { credentials: "include" });
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'processing') return 2000;
      return false;
    },
  });

  useEffect(() => {
    if (job?.status === 'completed' || job?.status === 'failed') {
      onDone();
    }
  }, [job?.status, onDone]);

  if (!job || job.status === 'completed' || job.status === 'failed') return null;

  const pct = job.totalProperties > 0 ? Math.round((job.processed / job.totalProperties) * 100) : 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium text-blue-800">Bulk upload in progress</span>
        <span className="text-blue-600 ml-2">{job.processed}/{job.totalProperties} properties ({pct}%)</span>
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
        const res = await fetch(`${API_BASE_URL}/api/auth/session/verify`, { credentials: "include" });
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
      await fetch(`${API_BASE_URL}/api/auth/session/logout`, { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    navigate("/");
  };

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] });
    toast({ title: "Refreshed", description: "Portfolio data updated" });
  }, [queryClient, toast]);

  const { data: properties = [], isLoading } = useQuery<ManagedProperty[]>({
    queryKey: ["/api/portfolio/properties"],
    enabled: sessionValid,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] });
      toast({ title: "Property removed" });
    },
    onError: () => toast({ title: "Error", description: "Could not remove property", variant: "destructive" }),
  });

  const handleJobDone = useCallback(() => {
    setActiveJobId(null);
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] });
    toast({ title: "Bulk upload complete", description: "Your portfolio has been updated." });
  }, [queryClient, toast]);

  // Stats
  const total   = properties.length;
  const active  = properties.filter(p => p.activationStatus === "active").length;
  const pending = properties.filter(p => p.activationStatus === "pending").length;
  const scheduled = properties.filter(p => p.scheduleGenerated).length;

  // ── Loading states ───────────────────────────────────────────────────────

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
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
            <CardTitle>Access Required</CardTitle>
            <CardDescription>Please log in to access your Property Manager dashboard.</CardDescription>
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Property Manager</h1>
                <p className="text-emerald-100 text-sm">{total} / 200 properties in portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}
                className="bg-white/10 border-white/20 text-white">
                <LogOut className="h-4 w-4 mr-2" /> Logout
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <Building2 className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{active}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{pending}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-purple-600">{scheduled}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Portfolio Properties
                </CardTitle>
                <CardDescription>Manage your properties and AI maintenance schedules</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}
                  disabled={total >= 200}>
                  <Upload className="h-4 w-4 mr-2" /> Bulk Upload
                </Button>
                <Button size="sm" onClick={() => setShowAddModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={total >= 200}>
                  <Plus className="h-4 w-4 mr-2" /> Add Property
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="font-medium mb-1">No properties yet</p>
                <p className="text-sm mb-4">Add your first property or bulk upload from a CSV file.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" /> Bulk Upload
                  </Button>
                  <Button size="sm" onClick={() => setShowAddModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" /> Add Property
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Property</th>
                      <th className="pb-3 pr-4 font-medium hidden md:table-cell">Location</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Type</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Schedule</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {properties.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium">{p.propertyName}</p>
                          <p className="text-xs text-muted-foreground">{p.address}{p.unitNumber ? ` · ${p.unitNumber}` : ""}</p>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell text-muted-foreground">
                          {p.city}, {p.state} {p.zip}
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell capitalize text-muted-foreground">
                          {p.propertyType.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[p.activationStatus] ?? "bg-gray-100 text-gray-700"}`}>
                            {p.activationStatus}
                          </span>
                        </td>
                        <td className="py-3 pr-4 hidden lg:table-cell">
                          {p.scheduleGenerated ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Generated
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-500 text-xs">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Remove "${p.propertyName}"?`)) deleteMutation.mutate(p.id);
                            }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {total >= 200 && (
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-4 py-3 text-sm">
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
          onJobStarted={(id) => { setActiveJobId(id); }}
        />
      )}
    </div>
  );
}
