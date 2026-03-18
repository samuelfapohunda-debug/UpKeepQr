import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
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
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Loader2,
  Pencil,
  RefreshCw,
  X,
  Filter,
  Calendar,
  DollarSign,
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
  yearBuilt: number | null;
  squareFootage: number | null;
  hvacType: string | null;
  activationStatus: string;
  scheduleGenerated: boolean;
  createdAt: string;
}

interface MaintenanceTask {
  id: number;
  householdId: string;
  homeProfileId: number;
  title: string;
  description: string | null;
  month: number;
  frequency: string;
  category: string;
  priority: string;
  estimatedCostMin: number | null;
  estimatedCostMax: number | null;
  isCompleted: boolean;
  completedAt: string | null;
  dueDate: string | null;
}

interface TasksResponse {
  tasks: MaintenanceTask[];
  scheduleGenerated: boolean;
}

interface Household {
  id: string;
  firstName?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending:  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getPriorityVariant(priority: string): "destructive" | "default" | "secondary" | "outline" {
  if (priority === "high")   return "destructive";
  if (priority === "medium") return "default";
  return "secondary";
}

function formatDueDate(dueDate: string | null, month: number): string {
  if (dueDate) {
    const d = new Date(dueDate);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return MONTHS[month - 1] ?? "—";
}

function isOverdue(task: MaintenanceTask): boolean {
  if (task.isCompleted) return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

// ── Edit Property Modal ────────────────────────────────────────────────────

interface EditPropertyModalProps {
  property: ManagedProperty;
  onClose: () => void;
  onSaved: () => void;
}

function EditPropertyModal({ property, onClose, onSaved }: EditPropertyModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    propertyName:     property.propertyName,
    address:          property.address,
    city:             property.city,
    state:            property.state,
    zip:              property.zip,
    unitNumber:       property.unitNumber ?? "",
    propertyType:     property.propertyType,
    yearBuilt:        property.yearBuilt?.toString() ?? "",
    squareFootage:    property.squareFootage?.toString() ?? "",
    hvacType:         property.hvacType ?? "",
    activationStatus: property.activationStatus,
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        propertyName:     form.propertyName,
        address:          form.address,
        city:             form.city,
        state:            form.state,
        zip:              form.zip,
        unitNumber:       form.unitNumber || null,
        propertyType:     form.propertyType,
        activationStatus: form.activationStatus,
        yearBuilt:        form.yearBuilt    ? parseInt(form.yearBuilt, 10)    : null,
        squareFootage:    form.squareFootage ? parseInt(form.squareFootage, 10) : null,
        hvacType:         form.hvacType || null,
      };
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast({ title: "Property updated" });
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
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
            <CardTitle>Edit Property</CardTitle>
            <CardDescription>Update property metadata. Schedule is not regenerated automatically.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Property Name *</Label>
              <Input id="edit-name" required value={form.propertyName} onChange={set("propertyName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Street Address *</Label>
              <Input id="edit-address" required value={form.address} onChange={set("address")} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input id="edit-city" required value={form.city} onChange={set("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State *</Label>
                <Input id="edit-state" required value={form.state} onChange={set("state")} maxLength={2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-zip">ZIP *</Label>
                <Input id="edit-zip" required value={form.zip} onChange={set("zip")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit #</Label>
                <Input id="edit-unit" value={form.unitNumber} onChange={set("unitNumber")} placeholder="e.g. 4A" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Property Type *</Label>
                <Select value={form.propertyType} onValueChange={(v) => setForm(f => ({ ...f, propertyType: v }))}>
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
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.activationStatus} onValueChange={(v) => setForm(f => ({ ...f, activationStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Year Built</Label>
                <Input id="edit-year" type="number" value={form.yearBuilt} onChange={set("yearBuilt")} placeholder="2005" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sqft">Sq Ft</Label>
                <Input id="edit-sqft" type="number" value={form.squareFootage} onChange={set("squareFootage")} placeholder="1800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hvac">HVAC Type</Label>
                <Input id="edit-hvac" value={form.hvacType} onChange={set("hvacType")} placeholder="central" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function PropertyManagerDetail() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch property
  const { data: property, isLoading: loadingProperty } = useQuery<ManagedProperty>({
    queryKey: ["/api/portfolio/properties", propertyId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties/${propertyId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch property");
      return res.json();
    },
    enabled: !!propertyId,
  });

  // Fetch tasks
  const { data: tasksData, isLoading: loadingTasks } = useQuery<TasksResponse>({
    queryKey: ["/api/portfolio/properties", propertyId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/properties/${propertyId}/tasks`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!propertyId,
    refetchInterval: (query) => {
      // Poll until schedule is generated
      const data = query.state.data as TasksResponse | undefined;
      return data && !data.scheduleGenerated ? 5000 : false;
    },
  });

  // Fetch household (needed for task complete mutation)
  const { data: household } = useQuery<Household>({
    queryKey: ["/api/customer/household"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/customer/household`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch household");
      return res.json();
    },
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ householdId: household?.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to complete task");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties", propertyId, "tasks"] });
      toast({ title: "Task marked complete" });
    },
    onError: (err: unknown) =>
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to complete task",
        variant: "destructive",
      }),
  });

  // Regenerate schedule mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/portfolio/regenerate/${propertyId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to regenerate");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties", propertyId, "tasks"] });
      toast({ title: "Regenerating schedule", description: "AI is building a new maintenance plan. Check back in a minute." });
    },
    onError: (err: unknown) =>
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start regeneration",
        variant: "destructive",
      }),
  });

  const tasks = tasksData?.tasks ?? [];
  const scheduleGenerated = tasksData?.scheduleGenerated ?? false;

  // Stats
  const now = new Date();
  const stats = useMemo(() => ({
    total:     tasks.length,
    completed: tasks.filter(t => t.isCompleted).length,
    pending:   tasks.filter(t => !t.isCompleted).length,
    overdue:   tasks.filter(t => isOverdue(t)).length,
  }), [tasks]);

  // Budget
  const annualBudget = useMemo(() =>
    tasks.reduce((sum, t) => sum + ((t.estimatedCostMin ?? 0) + (t.estimatedCostMax ?? 0)) / 2, 0),
    [tasks],
  );

  // Category filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(tasks.map(t => t.category))).sort();
    return ["all", ...cats];
  }, [tasks]);

  const filteredTasks = useMemo(() =>
    selectedCategory === "all" ? tasks : tasks.filter(t => t.category === selectedCategory),
    [tasks, selectedCategory],
  );

  if (loadingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Property Not Found</CardTitle>
            <CardDescription>This property does not exist or you do not have access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/property-manager")} className="w-full">
              Back to Portfolio
            </Button>
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
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/property-manager")}
                className="text-white hover:bg-white/20 mt-0.5 flex-shrink-0"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold sm:text-2xl">{property.propertyName}</h1>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs border-white/40 ${STATUS_COLORS[property.activationStatus] ?? ""}`}
                  >
                    {property.activationStatus}
                  </Badge>
                </div>
                <p className="text-blue-100 text-sm mt-0.5">
                  {property.address}{property.unitNumber ? ` · ${property.unitNumber}` : ""} · {property.city}, {property.state} {property.zip}
                </p>
                <p className="text-blue-200 text-xs mt-0.5 capitalize">
                  {property.propertyType.replace(/_/g, " ")}
                  {property.yearBuilt ? ` · Built ${property.yearBuilt}` : ""}
                  {property.squareFootage ? ` · ${property.squareFootage.toLocaleString()} sq ft` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending || !scheduleGenerated}
                data-testid="button-regenerate"
              >
                {regenerateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate Schedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                data-testid="button-edit"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card data-testid="stat-total">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                </div>
                <ListTodo className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card data-testid="stat-completed">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</p>
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
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.pending}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card data-testid="stat-overdue">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Overdue</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Maintenance Tasks
                </CardTitle>
                <CardDescription>
                  AI-generated maintenance schedule for this property
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filter:</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !scheduleGenerated ? (
              <div className="text-center py-16 text-muted-foreground">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-amber-500 opacity-80" />
                <p className="font-medium mb-1">AI schedule is being generated</p>
                <p className="text-sm">Check back in a moment. This page will refresh automatically.</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No tasks found</p>
                <p className="text-sm mb-4">Try regenerating the schedule if data looks incomplete.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Schedule
                </Button>
              </div>
            ) : (
              <>
                {/* Category filter tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="capitalize"
                      data-testid={`filter-${cat}`}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks in this category.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task) => {
                      const overdue = isOverdue(task);
                      return (
                        <div
                          key={task.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                          data-testid={`task-${task.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-medium truncate" data-testid={`task-title-${task.id}`}>
                                {task.title}
                              </h3>
                              <Badge variant={getPriorityVariant(task.priority)} className="text-xs capitalize">
                                {task.priority}
                              </Badge>
                              {task.isCompleted && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                  Completed
                                </Badge>
                              )}
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="capitalize">{task.category}</span>
                              <span className="capitalize">{task.frequency}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-muted-foreground">Due</p>
                              <p className={`text-sm font-medium ${overdue ? "text-red-600" : ""}`}>
                                {formatDueDate(task.dueDate, task.month)}
                              </p>
                            </div>
                            {!task.isCompleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => completeMutation.mutate(task.id)}
                                disabled={completeMutation.isPending}
                                data-testid={`button-complete-${task.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Annual Budget */}
        {scheduleGenerated && tasks.length > 0 && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Annual Maintenance Budget</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${Math.round(annualBudget).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Based on midpoint estimates across {tasks.length} tasks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showEditModal && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties", propertyId] });
            queryClient.invalidateQueries({ queryKey: ["/api/portfolio/properties"] });
          }}
        />
      )}
    </div>
  );
}
