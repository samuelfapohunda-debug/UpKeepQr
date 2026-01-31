import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth, getAuthToken } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api-config';
import { Household, SetupFormNote, AdminSetupFormFilters } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Refrigerator,
  ListTodo,
} from 'lucide-react';
import ApplianceManager from '@/components/ApplianceManager';
import { HouseholdTasksView } from '@/components/HouseholdTasksView';

const statusColors: Record<string, string> = {
  not_started: 'bg-gray-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
};

const statusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

interface HouseholdDetail extends Household {
  notes?: SetupFormNote[];
  profileExtras?: Array<{ key: string; value: string }>;
}

export default function SetupFormsDashboard() {
  const { logout } = useAuth();
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedHouseholdForAppliances, setSelectedHouseholdForAppliances] = useState<
    string | null
  >(null);
  const [showApplianceManager, setShowApplianceManager] = useState(false);
  const [selectedHouseholdForTasks, setSelectedHouseholdForTasks] = useState<string | null>(null);
  const [showTasksView, setShowTasksView] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [searchDebounce, setSearchDebounce] = useState('');

  // Filters state
  const [filters, setFilters] = useState<AdminSetupFormFilters>({
    q: '',
    status: 'all',
    city: '',
    state: '',
    zipcode: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 25,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const { toast } = useToast();

  // Create household form state
  const [_createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    zip: '',
    homeType: 'single_family' as 'single_family' | 'condo' | 'townhouse' | 'apartment',
    skipWelcomeEmail: false,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, q: searchDebounce, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchDebounce]);

  // Reset tab and note state when household changes
  useEffect(() => {
    setNewNote('');
    setActiveTab('details');
  }, [selectedHousehold?.id]);

  // Fetch households with filters
  const { data: householdsData, isLoading: householdsLoading } = useQuery({
    queryKey: ['/api/admin/setup-forms', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.city) params.set('city', filters.city);
      if (filters.state) params.set('state', filters.state);
      if (filters.zipcode) params.set('zipcode', filters.zipcode);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      params.set('page', filters.page.toString());
      params.set('pageSize', filters.pageSize.toString());
      params.set('sortBy', filters.sortBy);
      params.set('sortDir', filters.sortDir);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/setup-forms?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch households');
      }

      return response.json();
    },
  });

  const households = householdsData?.data || [];
  const pagination = householdsData?.pagination || {
    page: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 1,
  };

  // Fetch detailed household data
  const { data: householdDetail } = useQuery({
    queryKey: ['/api/admin/setup-forms/detail', selectedHousehold?.id],
    queryFn: async () => {
      if (!selectedHousehold?.id) return null;
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/admin/setup-forms/${selectedHousehold.id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch household details');
      }
      return response.json();
    },
    enabled: !!selectedHousehold?.id,
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedHousehold?.id) throw new Error('No household selected');
      return apiRequest('POST', `/api/admin/setup-forms/${selectedHousehold.id}/notes`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/setup-forms/detail', selectedHousehold?.id],
      });
      setNewNote('');
      toast({
        title: 'Note added',
        description: 'Internal note has been saved',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      if (!selectedHousehold?.id) throw new Error('No household selected');
      return apiRequest('DELETE', `/api/admin/setup-forms/${selectedHousehold.id}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/setup-forms/detail', selectedHousehold?.id],
      });
      toast({
        title: 'Note deleted',
        description: 'Internal note has been removed',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    },
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async (type: 'email' | 'sms' | 'both') => {
      if (!selectedHousehold?.id) throw new Error('No household selected');
      return apiRequest('/api/admin/setup-forms/test-notification', {
        method: 'POST',
        body: JSON.stringify({
          householdId: selectedHousehold.id,
          type,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Test notification sent',
        description: "Check the household's contact info for delivery",
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    },
  });

  // Create household mutation
  const _createHouseholdMutation = useMutation({
    mutationFn: async (data: typeof _createForm) => {
      return apiRequest('/api/admin/setup-forms/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/setup-forms'] });
      setShowCreateDialog(false);
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        zip: '',
        homeType: 'single_family',
        skipWelcomeEmail: false,
      });
      toast({
        title: 'Household created',
        description: 'The household has been successfully created',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create household',
        variant: 'destructive',
      });
    },
  });

  const handleViewDetail = async (household: Household) => {
    setSelectedHousehold(household as HouseholdDetail);
    setShowDetail(true);
  };

  const _handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedHousehold(null);
  };

  const _handleAddNote = () => {
    if (!newNote.trim()) return;
    createNoteMutation.mutate(newNote);
  };

  const _handleDeleteNote = (noteId: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const _handleTestNotification = (type: 'email' | 'sms' | 'both') => {
    testNotificationMutation.mutate(type);
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4" data-testid="setup-forms-dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">
              Setup Forms Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage household setup workflows and track completion
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/new-setup">
              <Button data-testid="button-create-household">
                <Plus className="h-4 w-4 mr-2" />
                Create Household
              </Button>
            </Link>
            <Button variant="outline" onClick={logout} data-testid="button-logout">
              Logout
            </Button>
          </div>
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
                    placeholder="Name, email, phone..."
                    value={searchDebounce}
                    onChange={e => setSearchDebounce(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="select-status">
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

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Filter by city"
                  value={filters.city}
                  onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  data-testid="input-city"
                />
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Filter by state"
                  value={filters.state}
                  onChange={e => setFilters(prev => ({ ...prev, state: e.target.value }))}
                  data-testid="input-state"
                />
              </div>

              {/* Zipcode */}
              <div className="space-y-2">
                <Label htmlFor="zipcode">Zipcode</Label>
                <Input
                  id="zipcode"
                  placeholder="Filter by zipcode"
                  value={filters.zipcode}
                  onChange={e => setFilters(prev => ({ ...prev, zipcode: e.target.value }))}
                  data-testid="input-zipcode"
                />
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Completed From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  data-testid="input-date-from"
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label htmlFor="dateTo">Completed To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  data-testid="input-date-to"
                />
              </div>

              {/* Clear Filters */}
              <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  data-testid="button-clear-filters"
                  onClick={() => {
                    setFilters({
                      q: '',
                      status: '',
                      city: '',
                      state: '',
                      zipcode: '',
                      dateFrom: '',
                      dateTo: '',
                      page: 1,
                      pageSize: 25,
                      sortBy: 'createdAt',
                      sortDir: 'desc',
                    });
                    setSearchDebounce('');
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
            <CardDescription>Click on a row to view details and manage setup</CardDescription>
          </CardHeader>
          <CardContent>
            {householdsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : households.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No households found</div>
            ) : (
              <>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('name')}
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
                            onClick={() => handleSort('setupCompletedAt')}
                            data-testid="button-sort-completed"
                            className="flex items-center gap-1"
                          >
                            Status
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('createdAt')}
                            data-testid="button-sort-created"
                            className="flex items-center gap-1"
                          >
                            Created
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">QR Code</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {households.map(household => (
                        <TableRow
                          key={household.id}
                          data-testid={`row-household-${household.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handleViewDetail(household)}
                        >
                          <TableCell className="font-medium">
                            <div data-testid={`text-name-${household.id}`}>{household.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div data-testid={`text-email-${household.id}`}>
                                {household.email}
                              </div>
                              <div className="text-muted-foreground">{household.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                {household.city}, {household.state}
                              </div>
                              <div className="text-muted-foreground">{household.zip}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[household.setupStatus || 'not_started']}>
                              {statusLabels[household.setupStatus || 'not_started']}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {household.createdAt
                              ? new Date(household.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <code className="text-xs">{household.qrCode}</code>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-view-${household.id}`}
                                onClick={() => handleViewDetail(household)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-appliances-${household.id}`}
                                onClick={() => {
                                  setSelectedHouseholdForAppliances(household.id);
                                  setShowApplianceManager(true);
                                }}
                                title="Manage Appliances"
                              >
                                <Refrigerator className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-tasks-${household.id}`}
                                onClick={() => {
                                  setSelectedHouseholdForTasks(household.id);
                                  setShowTasksView(true);
                                }}
                                title="View Tasks"
                              >
                                <ListTodo className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-first-page"
                      onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-prev-page"
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
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
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-last-page"
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.totalPages }))}
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

      {/* Detail Dialog with Tabs */}
      {showDetail && selectedHousehold && (
        <Dialog open={showDetail} onOpenChange={(open) => {
          if (!open) {
            setShowDetail(false);
            setSelectedHousehold(null);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Household Details - {selectedHousehold.name}</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
                <TabsTrigger value="appliances" data-testid="tab-appliances">Appliances</TabsTrigger>
                <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm" data-testid="detail-email">{selectedHousehold.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm" data-testid="detail-phone">{selectedHousehold.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm" data-testid="detail-address">
                      {selectedHousehold.address}, {selectedHousehold.city}, {selectedHousehold.state} {selectedHousehold.zip}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Setup Status</Label>
                    <Badge className={statusColors[selectedHousehold.setupStatus || 'not_started']}>
                      {statusLabels[selectedHousehold.setupStatus || 'not_started']}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">QR Code</Label>
                    <code className="text-sm" data-testid="detail-qrcode">{selectedHousehold.qrCode}</code>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Completed At</Label>
                    <p className="text-sm" data-testid="detail-completed">
                      {selectedHousehold.setupCompletedAt 
                        ? new Date(selectedHousehold.setupCompletedAt).toLocaleDateString()
                        : 'Not completed'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1"
                      data-testid="input-note"
                    />
                    <Button 
                      onClick={() => createNoteMutation.mutate(newNote)}
                      disabled={!newNote.trim() || createNoteMutation.isPending}
                      data-testid="button-add-note"
                    >
                      Add Note
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {householdDetail?.notes?.map((note: SetupFormNote) => (
                      <Card key={note.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm flex-1">{note.content}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              disabled={deleteNoteMutation.isPending}
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    {(!householdDetail?.notes || householdDetail.notes.length === 0) && (
                      <p className="text-sm text-muted-foreground">No notes yet.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Appliances Tab */}
              <TabsContent value="appliances" className="space-y-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Appliances</h3>
                  <Button
                    onClick={() => {
                      setSelectedHouseholdForAppliances(selectedHousehold.id);
                      setShowApplianceManager(true);
                      setShowDetail(false);
                    }}
                    data-testid="button-manage-appliances"
                  >
                    Manage Appliances
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click "Manage Appliances" to view and edit appliances for this household.
                </p>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-4 mt-4">
                <HouseholdTasksView householdId={selectedHousehold.id} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Appliance Manager Dialog */}
      {showApplianceManager && selectedHouseholdForAppliances && (
        <Dialog open={showApplianceManager} onOpenChange={(open) => {
          if (!open) {
            setShowApplianceManager(false);
            setSelectedHouseholdForAppliances(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ApplianceManager
              householdId={selectedHouseholdForAppliances}
              onClose={() => {
                setShowApplianceManager(false);
                setSelectedHouseholdForAppliances(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Tasks View Dialog */}
      {showTasksView && selectedHouseholdForTasks && (
        <Dialog open={showTasksView} onOpenChange={(open) => {
          if (!open) {
            setShowTasksView(false);
            setSelectedHouseholdForTasks(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <HouseholdTasksView 
              householdId={selectedHouseholdForTasks} 
              onBack={() => {
                setShowTasksView(false);
                setSelectedHouseholdForTasks(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Cache bust: 1766370010
