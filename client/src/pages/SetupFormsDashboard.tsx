import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getAuthToken } from "@/contexts/AuthContext";
import { Household, SetupFormNote, AdminSetupFormFilters } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, Bell, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";

const statusColors: Record<string, string> = {
  not_started: "bg-gray-500",
  in_progress: "bg-yellow-500",
  completed: "bg-green-500",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

interface HouseholdDetail extends Household {
  notes?: SetupFormNote[];
  profileExtras?: Array<{ key: string; value: string }>;
}

export default function SetupFormsDashboard() {
  const { logout } = useAuth();
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Filters state
  const [filters, setFilters] = useState<AdminSetupFormFilters>({
    q: "",
    status: "all",
    city: "",
    state: "",
    zipcode: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    pageSize: 25,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchDebounce, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchDebounce]);

  // Fetch households with filters
  const { data: householdsData, isLoading: householdsLoading } = useQuery({
    queryKey: ["/api/admin/setup-forms", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.city) params.set("city", filters.city);
      if (filters.state) params.set("state", filters.state);
      if (filters.zipcode) params.set("zipcode", filters.zipcode);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      params.set("page", filters.page.toString());
      params.set("pageSize", filters.pageSize.toString());
      params.set("sortBy", filters.sortBy);
      params.set("sortDir", filters.sortDir);

      const token = getAuthToken();
      const response = await fetch(`/api/admin/setup-forms?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch households");
      }

      return response.json();
    },
  });

  // Fetch household detail
  const { data: householdDetail, refetch: refetchDetail } = useQuery<HouseholdDetail>({
    queryKey: ["/api/admin/setup-forms", selectedHousehold?.id],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/setup-forms/${selectedHousehold?.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch household detail");
      }

      return response.json();
    },
    enabled: !!selectedHousehold?.id && showDetail,
  });

  // Update household mutation
  const updateHouseholdMutation = useMutation({
    mutationFn: async (data: Partial<Household>) => {
      const res = await apiRequest("PUT", `/api/admin/setup-forms/${selectedHousehold?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Household updated",
        description: "Changes saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/setup-forms"] });
      refetchDetail();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/admin/setup-forms/${selectedHousehold?.id}/notes`, { content });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Note added",
        description: "Internal note created successfully",
      });
      setNewNote("");
      refetchDetail();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/setup-forms/${selectedHousehold?.id}/notes/${noteId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Note deleted",
        description: "Internal note removed successfully",
      });
      refetchDetail();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async (channel: "email" | "sms" | "both") => {
      const res = await apiRequest("POST", `/api/admin/setup-forms/${selectedHousehold?.id}/test-notification`, { channel });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test notification sent",
        description: data?.message || "Notification sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortDir: prev.sortBy === column && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetail = (household: Household) => {
    setSelectedHousehold(household);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedHousehold(null);
    setNewNote("");
  };

  const handleUpdateStatus = (status: "not_started" | "in_progress" | "completed") => {
    if (selectedHousehold) {
      updateHouseholdMutation.mutate({ setupStatus: status });
    }
  };

  const handleUpdateField = (field: string, value: string) => {
    if (selectedHousehold) {
      updateHouseholdMutation.mutate({ [field]: value });
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleTestNotification = (channel: "email" | "sms" | "both") => {
    testNotificationMutation.mutate(channel);
  };

  const households = householdsData?.data || [];
  const pagination = householdsData?.pagination || {
    page: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Admin Setup Forms
            </h1>
            <p className="text-muted-foreground">
              Manage household setup workflows and track completion
            </p>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            Logout
          </Button>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    data-testid="input-search"
                    placeholder="Name, email, phone..."
                    value={searchDebounce}
                    onChange={(e) => setSearchDebounce(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value, page: 1 }))
                  }
                >
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  data-testid="input-city"
                  placeholder="Filter by city"
                  value={filters.city}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, city: e.target.value, page: 1 }))
                  }
                />
              </div>

              {/* State Filter */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  data-testid="input-state"
                  placeholder="Filter by state"
                  value={filters.state}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, state: e.target.value, page: 1 }))
                  }
                />
              </div>

              {/* Zipcode Filter */}
              <div className="space-y-2">
                <Label htmlFor="zipcode">Zipcode</Label>
                <Input
                  id="zipcode"
                  data-testid="input-zipcode"
                  placeholder="Filter by zipcode"
                  value={filters.zipcode}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, zipcode: e.target.value, page: 1 }))
                  }
                />
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Completed From</Label>
                <Input
                  id="dateFrom"
                  data-testid="input-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateFrom: e.target.value, page: 1 }))
                  }
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label htmlFor="dateTo">Completed To</Label>
                <Input
                  id="dateTo"
                  data-testid="input-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value, page: 1 }))
                  }
                />
              </div>

              {/* Clear Filters */}
              <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  data-testid="button-clear-filters"
                  onClick={() => {
                    setFilters({
                      q: "",
                      status: "",
                      city: "",
                      state: "",
                      zipcode: "",
                      dateFrom: "",
                      dateTo: "",
                      page: 1,
                      pageSize: 25,
                      sortBy: "createdAt",
                      sortDir: "desc",
                    });
                    setSearchDebounce("");
                  }}
                  className="w-full"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Households ({pagination.totalCount})</CardTitle>
            <CardDescription>
              Click on a row to view details and manage setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            {householdsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : households.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No households found
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("name")}
                            data-testid="button-sort-name"
                            className="flex items-center gap-1"
                          >
                            Name
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Email / Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("setupCompletedAt")}
                            data-testid="button-sort-completed"
                            className="flex items-center gap-1"
                          >
                            Status
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>QR Code</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {households.map((household) => (
                        <TableRow
                          key={household.id}
                          data-testid={`row-household-${household.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handleViewDetail(household)}
                        >
                          <TableCell className="font-medium">
                            <div data-testid={`text-name-${household.id}`}>
                              {household.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div data-testid={`text-email-${household.id}`}>
                                {household.email}
                              </div>
                              <div className="text-muted-foreground" data-testid={`text-phone-${household.id}`}>
                                {household.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{household.city}, {household.state}</div>
                              <div className="text-muted-foreground">{household.zipcode}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={statusColors[household.setupStatus || "not_started"]}
                              data-testid={`badge-status-${household.id}`}
                            >
                              {statusLabels[household.setupStatus || "not_started"]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground" data-testid={`text-qr-${household.id}`}>
                              {household.magnetCode || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-${household.id}`}
                              onClick={() => handleViewDetail(household)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{" "}
                    {pagination.totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-first-page"
                      onClick={() => setFilters((prev) => ({ ...prev, page: 1 }))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-prev-page"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-next-page"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-last-page"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: pagination.totalPages }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              Household Setup Details
            </DialogTitle>
            <DialogDescription>
              Manage setup workflow and internal notes for {householdDetail?.name}
            </DialogDescription>
          </DialogHeader>

          {householdDetail && (
            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <div data-testid="text-detail-name">{householdDetail.name}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <div data-testid="text-detail-email">{householdDetail.email}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <div data-testid="text-detail-phone">{householdDetail.phone}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">QR Code</Label>
                    <div data-testid="text-detail-qr">{householdDetail.magnetCode || "N/A"}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Setup Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Setup Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="setupStatus">Current Status</Label>
                    <Select
                      value={householdDetail.setupStatus || "not_started"}
                      onValueChange={handleUpdateStatus}
                    >
                      <SelectTrigger id="setupStatus" data-testid="select-detail-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Started At</Label>
                      <div data-testid="text-detail-started">
                        {householdDetail.setupStartedAt
                          ? new Date(householdDetail.setupStartedAt).toLocaleString()
                          : "Not started"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Completed At</Label>
                      <div data-testid="text-detail-completed">
                        {householdDetail.setupCompletedAt
                          ? new Date(householdDetail.setupCompletedAt).toLocaleString()
                          : "Not completed"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setupNotes">Setup Notes (Public)</Label>
                    <Textarea
                      id="setupNotes"
                      data-testid="textarea-setup-notes"
                      value={householdDetail.setupNotes || ""}
                      onChange={(e) => handleUpdateField("setupNotes", e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value !== householdDetail.setupNotes) {
                          handleUpdateField("setupNotes", e.target.value);
                        }
                      }}
                      rows={3}
                      placeholder="Public notes visible to homeowner..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setupIssues">Setup Issues</Label>
                    <Textarea
                      id="setupIssues"
                      data-testid="textarea-setup-issues"
                      value={householdDetail.setupIssues || ""}
                      onChange={(e) => handleUpdateField("setupIssues", e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value !== householdDetail.setupIssues) {
                          handleUpdateField("setupIssues", e.target.value);
                        }
                      }}
                      rows={2}
                      placeholder="Document any setup issues..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Internal Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Internal Notes</CardTitle>
                  <CardDescription>
                    Private admin notes (not visible to homeowner)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Note */}
                  <div className="flex gap-2">
                    <Textarea
                      data-testid="textarea-new-note"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add internal note..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      data-testid="button-add-note"
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || createNoteMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {householdDetail.notes && householdDetail.notes.length > 0 ? (
                      householdDetail.notes.map((note) => (
                        <Card key={note.id} data-testid={`card-note-${note.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <p className="text-sm" data-testid={`text-note-content-${note.id}`}>
                                  {note.content}
                                </p>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  <span data-testid={`text-note-author-${note.id}`}>
                                    By: {note.createdBy}
                                  </span>
                                  <span data-testid={`text-note-date-${note.id}`}>
                                    {new Date(note.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-note-${note.id}`}
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={deleteNoteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No internal notes yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Notifications</CardTitle>
                  <CardDescription>
                    Send test notifications to verify communication settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      data-testid="button-test-email"
                      onClick={() => handleTestNotification("email")}
                      disabled={testNotificationMutation.isPending}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Test Email
                    </Button>
                    <Button
                      variant="outline"
                      data-testid="button-test-sms"
                      onClick={() => handleTestNotification("sms")}
                      disabled={testNotificationMutation.isPending}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Test SMS
                    </Button>
                    <Button
                      variant="outline"
                      data-testid="button-test-both"
                      onClick={() => handleTestNotification("both")}
                      disabled={testNotificationMutation.isPending}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Test Both
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetail} data-testid="button-close-dialog">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
