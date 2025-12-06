import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getAuthToken, getAuthHeaders } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api-config";
import { ProRequest, Note, AuditEvent, AdminProRequestFilters } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, Eye, User, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  trade: "roofing" | "plumbing" | "electrical" | "hvac" | "general";
  coverageZips: string[];
  email: string;
  phone: string;
}

const statusColors = {
  new: "bg-blue-500",
  assigned: "bg-yellow-500", 
  in_progress: "bg-orange-500",
  completed: "bg-green-500",
  canceled: "bg-gray-500"
};

const urgencyColors = {
  emergency: "bg-red-500",
  "24h": "bg-orange-500",
  "3days": "bg-yellow-500",
  flexible: "bg-green-500"
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ProRequest | null>(null);
  const [showProviderPicker, setShowProviderPicker] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>("");
  
  // Filters state
  const [filters, setFilters] = useState<AdminProRequestFilters>({
    status: [],
    trade: "",
    urgency: "",
    zip: "",
    providerAssigned: "",
    q: "",
    page: 1,
    pageSize: 25,
    sortBy: "createdAt",
    sortDir: "desc"
  });

  const { toast } = useToast();

  // Fetch pro requests with filters
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/admin/pro-requests", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(s => params.append("status", s));
      }
      if (filters.trade && filters.trade !== "all") params.set("trade", filters.trade);
      if (filters.urgency && filters.urgency !== "all") params.set("urgency", filters.urgency);
      if (filters.zip) params.set("zip", filters.zip);
      if (filters.providerAssigned) params.set("providerAssigned", filters.providerAssigned);
      if (filters.q) params.set("q", filters.q);
      params.set("page", filters.page.toString());
      params.set("pageSize", filters.pageSize.toString());
      params.set("sortBy", filters.sortBy);
      params.set("sortDir", filters.sortDir);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/pro-requests?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      return response.json();
    },
  });

  // Fetch providers for picker
  const { data: providers } = useQuery({
    queryKey: ["/api/admin/providers", selectedRequest?.trade, selectedRequest?.zip],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedRequest?.trade) params.set("trade", selectedRequest.trade);
      if (selectedRequest?.zip) params.set("zip", selectedRequest.zip);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/providers?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) throw new Error("Failed to fetch providers");
      return response.json();
    },
    enabled: showProviderPicker && !!selectedRequest,
  });

  // Fetch notes and history for selected request
  const { data: notes } = useQuery({
    queryKey: ["/api/admin/pro-requests", selectedRequest?.id, "history"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/pro-requests/${selectedRequest!.id}/history`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
    enabled: !!selectedRequest,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, providerAssigned }: { id: string; status: string; providerAssigned?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/pro-requests/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status, providerAssigned })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to update status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pro-requests"] });
      if (selectedRequest) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/pro-requests", selectedRequest.id, "history"] });
      }
      toast({
        title: "Success",
        description: "Request status updated successfully",
      });
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/pro-requests/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to add note");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pro-requests", selectedRequest?.id, "history"] });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    },
  });

  // Calculate KPIs
  const kpis = {
    new: requestsData?.items?.filter((r: ProRequest) => r.status === "new").length || 0,
    assigned: requestsData?.items?.filter((r: ProRequest) => r.status === "assigned").length || 0,
    inProgress: requestsData?.items?.filter((r: ProRequest) => r.status === "in_progress").length || 0,
    completed: requestsData?.items?.filter((r: ProRequest) => r.status === "completed" && 
      new Date(r.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Request a Pro Dashboard
            </h1>
            <Button variant="outline" onClick={logout} data-testid="button-admin-logout">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.new}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.assigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed (7d)</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{kpis.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search requests..."
                    className="pl-10"
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="trade">Trade</Label>
                <Select value={filters.trade} onValueChange={(value) => setFilters({ ...filters, trade: value, page: 1 })}>
                  <SelectTrigger data-testid="select-trade">
                    <SelectValue placeholder="All trades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All trades</SelectItem>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={filters.urgency} onValueChange={(value) => setFilters({ ...filters, urgency: value, page: 1 })}>
                  <SelectTrigger data-testid="select-urgency">
                    <SelectValue placeholder="All urgencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All urgencies</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="24h">Within 24h</SelectItem>
                    <SelectItem value="3days">Within 3 days</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="ZIP code"
                  value={filters.zip}
                  onChange={(e) => setFilters({ ...filters, zip: e.target.value, page: 1 })}
                  data-testid="input-zip"
                />
              </div>

              <div>
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  placeholder="Provider name"
                  value={filters.providerAssigned}
                  onChange={(e) => setFilters({ ...filters, providerAssigned: e.target.value, page: 1 })}
                  data-testid="input-provider"
                />
              </div>

              <div>
                <Label>Status</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["new", "assigned", "in_progress", "completed", "canceled"].map((status) => (
                    <Button
                      key={status}
                      variant={filters.status.includes(status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newStatus = filters.status.includes(status)
                          ? filters.status.filter(s => s !== status)
                          : [...filters.status, status];
                        setFilters({ ...filters, status: newStatus, page: 1 });
                      }}
                      data-testid={`button-status-${status}`}
                    >
                      {status.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Service Requests</CardTitle>
            <CardDescription>
              {requestsData?.total || 0} total requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Tracking Code</TableHead>
                      <TableHead>Trade</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>ZIP</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestsData?.items?.map((request: ProRequest) => (
                      <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(request.publicTrackingCode)}
                            data-testid={`button-copy-${request.id}`}
                          >
                            {request.publicTrackingCode}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.trade}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-white ${urgencyColors[request.urgency]}`}>
                            {request.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.zip}</TableCell>
                        <TableCell>{request.contactName}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(request.contactPhone)}
                          >
                            {request.contactPhone}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-white ${statusColors[request.status]}`}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.providerAssigned || "—"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                            data-testid={`button-view-${request.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((filters.page - 1) * filters.pageSize) + 1} to{" "}
                    {Math.min(filters.page * filters.pageSize, requestsData?.total || 0)} of{" "}
                    {requestsData?.total || 0} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page <= 1}
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page >= Math.ceil((requestsData?.total || 0) / filters.pageSize)}
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Detail Drawer */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details - {selectedRequest.publicTrackingCode}</DialogTitle>
              <DialogDescription>
                Submitted {new Date(selectedRequest.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Service Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Trade:</strong> {selectedRequest.trade}</div>
                    <div><strong>Urgency:</strong> {selectedRequest.urgency}</div>
                    <div><strong>Description:</strong> {selectedRequest.description}</div>
                    {selectedRequest.preferredWindows && (
                      <div><strong>Preferred Windows:</strong> {selectedRequest.preferredWindows}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedRequest.contactName}</div>
                    <div><strong>Email:</strong> {selectedRequest.contactEmail}</div>
                    <div><strong>Phone:</strong> {selectedRequest.contactPhone}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <div className="space-y-2 text-sm">
                    <div>{selectedRequest.addressLine1}</div>
                    {selectedRequest.addressLine2 && <div>{selectedRequest.addressLine2}</div>}
                    <div>{selectedRequest.city}, {selectedRequest.state} {selectedRequest.zip}</div>
                  </div>
                </div>

                {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Photos</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRequest.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Panel */}
              <div className="space-y-4">
                {/* Status Update */}
                <div>
                  <h3 className="font-semibold mb-2">Update Status</h3>
                  <div className="space-y-2">
                    <Select 
                      value={selectedRequest.status}
                      onValueChange={(status) => {
                        updateStatusMutation.mutate({
                          id: selectedRequest.id,
                          status,
                          providerAssigned: selectedRequest.providerAssigned || undefined
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Provider Assignment */}
                <div>
                  <h3 className="font-semibold mb-2">Assign Provider</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Current: {selectedRequest.providerAssigned || "None"}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowProviderPicker(true)}
                      data-testid="button-assign-provider"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Choose Provider
                    </Button>
                  </div>
                </div>

                {/* Add Note */}
                <div>
                  <h3 className="font-semibold mb-2">Add Internal Note</h3>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note about this request..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      data-testid="textarea-note"
                    />
                    <Button
                      onClick={() => addNoteMutation.mutate({
                        id: selectedRequest.id,
                        message: newNote
                      })}
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                      data-testid="button-add-note"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>

                {/* History */}
                <div>
                  <h3 className="font-semibold mb-2">History & Notes</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {notes?.map((event: AuditEvent | Note) => (
                      <div key={event.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <div className="font-medium">
                          {"type" in event ? (
                            event.type === "status_change" ? "Status changed" :
                            event.type === "provider_assignment" ? "Provider assigned" :
                            "Note added"
                          ) : "Note"}
                        </div>
                        <div className="text-gray-600">
                          {"message" in event ? event.message : JSON.stringify(event.data)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(event.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Provider Picker Dialog */}
      {showProviderPicker && (
        <Dialog open={showProviderPicker} onOpenChange={setShowProviderPicker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Provider</DialogTitle>
              <DialogDescription>
                Choose a provider for {selectedRequest?.trade} services in {selectedRequest?.zip}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {providers?.map((provider: Provider) => (
                <div
                  key={provider.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedRequest!.id,
                      status: "assigned",
                      providerAssigned: provider.name
                    });
                    setShowProviderPicker(false);
                  }}
                  data-testid={`provider-${provider.id}`}
                >
                  <div className="font-semibold">{provider.name}</div>
                  <div className="text-sm text-gray-600">{provider.trade}</div>
                  <div className="text-sm text-gray-600">{provider.email}</div>
                  <div className="text-sm text-gray-600">{provider.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Coverage: {provider.coverageZips.join(", ")}
                  </div>
                </div>
              ))}
              {providers?.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No providers found for this trade and location
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}