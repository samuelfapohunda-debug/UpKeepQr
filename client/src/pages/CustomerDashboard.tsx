import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompleteTaskModal from "@/components/CompleteTaskModal";
import AddPropertyModal from "@/components/AddPropertyModal";
import { API_BASE_URL } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ListTodo,
  RefreshCw,
  Filter,
  Loader2,
  LogOut,
  CheckCircle,
  Settings,
  User,
  Download,
  Plus,
  Building2,
  X,
} from "lucide-react";
import HouseholdDetails from "@/components/HouseholdDetails";
import PushNotificationSetup from "@/components/PushNotificationSetup";
import ApplianceManager from "@/components/ApplianceManager";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import type { Task, Household, TasksResponse, TaskStats, DashboardTab, ManagedProperty } from "@/types/dashboard";
import { useTabState } from "@/hooks/useTabState";
import RealtorDashboard from "./RealtorDashboard";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "Not scheduled";
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? "Invalid date"
    : date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
};

const getPriorityVariant = (priority: string): "destructive" | "secondary" | "outline" => {
  switch (priority?.toLowerCase()) {
    case "high": return "destructive";
    case "medium": return "secondary";
    default: return "outline";
  }
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "pending": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "overdue": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default function CustomerDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useTabState<DashboardTab>("customerDashboardTab", "tasks");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [isDownloadingCalendar, setIsDownloadingCalendar] = useState(false);
  // Multi-property: null = primary home, string = managed property id
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showPropertyLimitModal, setShowPropertyLimitModal] = useState(false);

  // Download .ics calendar file for tasks
  const handleDownloadCalendar = useCallback(async (householdId: string) => {
    try {
      setIsDownloadingCalendar(true);
      
      const response = await fetch(`${API_BASE_URL}/api/calendar/household/${householdId}/tasks.ics`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate calendar' }));
        throw new Error(error.error || 'Failed to generate calendar file');
      }
      
      // Get the file content
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'MaintCue_Tasks.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Calendar Downloaded!",
        description: "Open the .ics file to import tasks into your calendar app (Google, Outlook, Apple, etc.)",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Could not generate calendar file",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingCalendar(false);
    }
  }, [toast]);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/session/verify`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setSessionValid(true);
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        navigate('/');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifySession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/session/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/');
  };

  const { data: household, isLoading: householdLoading, isFetching: householdFetching, error: householdError } = useQuery<Household>({
    queryKey: ['/api/customer/household'],
    enabled: sessionValid,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/customer/household`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch household');
      return response.json();
    }
  });

  const { data: realtorInfo } = useQuery<{ realtorName: string | null }>({
    queryKey: ['/api/realtor/provided-by'],
    enabled: sessionValid,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/realtor/provided-by`, {
        credentials: 'include'
      });
      if (!response.ok) return { realtorName: null };
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery<TasksResponse>({
    queryKey: ['/api/customer/tasks'],
    enabled: sessionValid,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/customer/tasks`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });

  // Tiers that can manage multiple properties.
  // Also include legacy 'plus' in case any existing rows were stored with the old incorrect value.
  const MULTI_PROPERTY_TIERS = ['homeowner_plus', 'plus', 'realtor', 'property_manager'];
  const canAddProperties = MULTI_PROPERTY_TIERS.includes(household?.subscriptionTier ?? '');
  // Any tier NOT in MULTI_PROPERTY_TIERS is treated as basic (includes 'basic', 'homeowner_basic', null, etc.)
  const isBasicPlan = !canAddProperties;

  const { data: managedProperties = [] } = useQuery<ManagedProperty[]>({
    queryKey: ['/api/portfolio/properties'],
    enabled: sessionValid && canAddProperties,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/portfolio/properties`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  // Tier-aware property limits (computed after managedProperties is available)
  const TIER_PROPERTY_LIMITS: Record<string, number> = {
    homeowner_basic: 1, basic: 1,
    homeowner_plus: 3,  plus: 3,
    property_manager: 200, realtor: 200,
  };
  const TIER_DISPLAY_NAMES: Record<string, string> = {
    homeowner_basic: 'Homeowner Basic', basic: 'Homeowner Basic',
    homeowner_plus: 'Homeowner Plus',  plus: 'Homeowner Plus',
    property_manager: 'Property Manager', realtor: 'Realtor',
  };
  const currentTier = household?.subscriptionTier ?? 'homeowner_basic';
  const tierLimit = TIER_PROPERTY_LIMITS[currentTier] ?? 1;
  const tierName = TIER_DISPLAY_NAMES[currentTier] ?? 'your current';
  // 1 primary home + any additional managed properties
  const totalPropertyCount = household ? 1 + managedProperties.length : 0;

  const handleAddPropertyClick = () => {
    if (totalPropertyCount >= tierLimit) {
      setShowPropertyLimitModal(true);
    } else {
      setShowAddPropertyModal(true);
    }
  };

  // Tasks for the currently selected secondary property
  const { data: propertyTasksData, isLoading: propertyTasksLoading } = useQuery<TasksResponse>({
    queryKey: ['/api/portfolio/properties', selectedPropertyId, 'tasks'],
    enabled: !!selectedPropertyId,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/portfolio/properties/${selectedPropertyId}/tasks`, {
        credentials: 'include'
      });
      if (!response.ok) return { tasks: [], summary: { total: 0, completed: 0, pending: 0, overdue: 0 } };
      const data = await response.json();
      const now = new Date();
      // Map raw DB rows to Task shape
      const tasks: Task[] = (data.tasks || []).map((t: any) => ({
        id: t.id,
        taskName: t.title ?? t.taskName,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.isCompleted ? 'completed' : (t.dueDate && new Date(t.dueDate) < now ? 'overdue' : 'pending'),
        dueDate: t.dueDate,
        frequencyMonths: t.frequency === 'monthly' ? 1 : t.frequency === 'quarterly' ? 3 : t.frequency === 'biannual' ? 6 : 12,
        completedAt: t.completedAt,
      }));
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const overdue = tasks.filter(t => t.status === 'overdue').length;
      return { tasks, summary: { total, completed, pending: total - completed - overdue, overdue } };
    }
  });

  // Active tasks data: primary home or selected managed property
  const activeTasks = selectedPropertyId
    ? (propertyTasksData?.tasks || [])
    : (tasksData?.tasks || []);
  const tasks = activeTasks;
  // Also treat as loading if we have stale no-address data and a refetch is in progress —
  // prevents the redirect-to-onboarding guard from firing on stale cache after setup completes
  const noAddress = !household?.streetAddress && !household?.city;
  const isLoading = householdLoading || tasksLoading || (householdFetching && noAddress) || (!!selectedPropertyId && propertyTasksLoading);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/customer/household'] });
    queryClient.invalidateQueries({ queryKey: ['/api/customer/tasks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/portfolio/properties'] });
    if (selectedPropertyId) {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/properties', selectedPropertyId, 'tasks'] });
    }
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
    });
  }, [queryClient, toast, selectedPropertyId]);

  const stats = useMemo((): TaskStats => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const overdue = tasks.filter(t => t.status === "overdue").length;
    return { total, completed, pending, overdue };
  }, [tasks]);

  const categories = useMemo(() => {
    const categorySet = new Set(tasks.map(t => t.category));
    return ["all", ...Array.from(categorySet)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedCategory === "all") return tasks;
    return tasks.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [tasks, selectedCategory]);

  interface CompleteTaskData {
    completionDate: string;
    cost?: string;
    serviceProvider?: string;
    partsReplaced?: string;
    notes?: string;
  }

  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: CompleteTaskData }) => {
      const response = await fetch(`${API_BASE_URL}/api/customer/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          status: 'completed' as const,
          completedAt: data.completionDate,
          cost: data.cost ? parseFloat(data.cost) : undefined,
          serviceProvider: data.serviceProvider || undefined,
          partsReplaced: data.partsReplaced || undefined,
          notes: data.notes || undefined,
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete task');
      }
      
      return response.json();
    },
    onSuccess: (updatedTask) => {
      toast({
        title: "Task Completed",
        description: `${updatedTask.taskName} has been marked as complete`,
      });
      
      queryClient.setQueryData<TasksResponse>(['/api/customer/tasks'], (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          )
        };
      });
      
      setShowCompleteDialog(false);
      setTaskToComplete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive",
      });
    }
  });

  const handleCompleteTask = (task: Task) => {
    setTaskToComplete(task);
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = (taskId: number, data: CompleteTaskData) => {
    completeTaskMutation.mutate({ taskId, data });
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground" data-testid="text-verifying-session">Verifying your session...</p>
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
              Sign in to access your home maintenance dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/login")} className="w-full" data-testid="button-signin">
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate("/pricing")} className="w-full" data-testid="button-plans">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (householdError || !household) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Unable to load your dashboard</CardTitle>
            <CardDescription>Please try refreshing the page.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => window.location.reload()} className="w-full">Refresh</Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Realtor / Agent tier — bypass address/onboarding checks entirely
  if (household.subscriptionTier === 'realtor') {
    return <RealtorDashboard />;
  }

  // No address yet — home profile setup hasn't been saved. Redirect to onboarding only
  // when we're NOT in the middle of a refetch (avoids loop on stale React Query cache).
  if (!household.streetAddress && !household.city && !householdFetching) {
    navigate('/onboarding');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold sm:text-2xl md:text-3xl" data-testid="text-welcome-name">
                  Welcome, {household.firstName}!
                </h1>
                <p className="text-blue-100 text-sm" data-testid="text-home-info">
                  {household.homeType} in {household.city}, {household.state}
                </p>
                {realtorInfo?.realtorName && (
                  <p className="text-blue-200 text-xs mt-0.5">
                    Provided by {realtorInfo.realtorName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRefresh}
                data-testid="button-refresh"
              >
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

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <SubscriptionBanner />

        {/* Property bar — always visible once household is loaded */}
        {household && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            {/* Primary home pill */}
            <button
              onClick={() => setSelectedPropertyId(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedPropertyId === null
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-background border-border text-muted-foreground hover:border-blue-400'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              {household.city || 'Primary Home'}
            </button>

            {/* Managed property pills (only for eligible tiers) */}
            {canAddProperties && managedProperties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => setSelectedPropertyId(prop.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedPropertyId === prop.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-background border-border text-muted-foreground hover:border-blue-400'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                {prop.propertyName}
              </button>
            ))}

            {/* Add Property button — always visible; tier limit enforced on click */}
            <button
              onClick={handleAddPropertyClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-border text-muted-foreground hover:border-blue-400 hover:text-blue-600 transition-colors"
              data-testid="button-add-property"
            >
              <Plus className="h-3.5 w-3.5" />
              + Add Property
            </button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              <ListTodo className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="appliances" data-testid="tab-appliances">
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Appliances</span>
            </TabsTrigger>
            <TabsTrigger value="details" data-testid="tab-details">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {selectedPropertyId
                        ? (managedProperties.find(p => p.id === selectedPropertyId)?.propertyName ?? 'Property') + ' — Tasks'
                        : 'Your Maintenance Tasks'}
                    </CardTitle>
                    <CardDescription>
                      {selectedPropertyId
                        ? 'Maintenance tasks for this property'
                        : 'Track and complete your personalized home maintenance schedule'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {household && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCalendar(household.id)}
                        disabled={isDownloadingCalendar || stats.pending === 0}
                        className="w-full sm:w-auto"
                        data-testid="button-sync-calendar"
                      >
                        {isDownloadingCalendar ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {isDownloadingCalendar ? 'Downloading...' : 'Sync to Calendar'}
                      </Button>
                    )}
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                      data-testid={`filter-${category}`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {tasks.length === 0 ? (
                      <>
                        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                        <p className="font-medium text-foreground">
                          {selectedPropertyId ? 'Maintenance schedule is being generated...' : 'Your maintenance schedule is being prepared...'}
                        </p>
                        <p className="text-sm mt-1">This usually takes under a minute. Refresh to check for updates.</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </>
                    ) : (
                      <>
                        <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tasks found in this category.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover-elevate"
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-medium truncate" data-testid={`task-name-${task.id}`}>
                              {task.taskName}
                            </h3>
                            <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="capitalize">{task.category}</span>
                            <span>Every {task.frequencyMonths} months</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-muted-foreground">Due</p>
                            <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          {task.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteTask(task)}
                              data-testid={`button-complete-${task.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Need help with a task? Connect with a local professional.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/request-pro")}
                data-testid="button-request-pro"
              >
                Request a Professional
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appliances">
            {household && (
              <ApplianceManager 
                householdId={household.id}
                onClose={() => {}}
              />
            )}
          </TabsContent>

          <TabsContent value="details">
            {household && (
              <div className="space-y-6">
                <HouseholdDetails
                  household={household}
                  onEdit={() => {
                    toast({
                      title: "Edit Feature",
                      description: "Household editing will be available soon.",
                    });
                  }}
                />
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-base font-semibold mb-1">Maintenance Alerts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get push notifications when important maintenance tasks are coming up.
                  </p>
                  <PushNotificationSetup />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CompleteTaskModal
        task={taskToComplete}
        isOpen={showCompleteDialog}
        onClose={() => {
          setShowCompleteDialog(false);
          setTaskToComplete(null);
        }}
        onComplete={handleConfirmComplete}
        isSubmitting={completeTaskMutation.isPending}
      />

      {showAddPropertyModal && (
        <AddPropertyModal
          onClose={() => setShowAddPropertyModal(false)}
          onAdded={(property) => {
            queryClient.invalidateQueries({ queryKey: ['/api/portfolio/properties'] });
            setSelectedPropertyId(property.id);
            setShowAddPropertyModal(false);
          }}
        />
      )}

      {/* Property limit upgrade modal */}
      {showPropertyLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Property Limit Reached</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPropertyLimitModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You've reached the {tierLimit}-property limit for your{' '}
                <span className="font-medium text-foreground">{tierName}</span> plan.
                Upgrade to add more properties.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowPropertyLimitModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowPropertyLimitModal(false);
                    navigate('/pricing');
                  }}
                >
                  View Upgrade Options
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
