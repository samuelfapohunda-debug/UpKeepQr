import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompleteTaskModal from "@/components/CompleteTaskModal";
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
  Download
} from "lucide-react";
import HouseholdDetails from "@/components/HouseholdDetails";
import ApplianceManager from "@/components/ApplianceManager";
import type { Task, Household, TasksResponse, TaskStats, DashboardTab } from "@/types/dashboard";
import { useTabState } from "@/hooks/useTabState";

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
      link.download = 'UpKeepQR_Tasks.ics';
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

  const { data: household, isLoading: householdLoading, error: householdError } = useQuery<Household>({
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

  const tasks = tasksData?.tasks || [];
  const isLoading = householdLoading || tasksLoading;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/customer/household'] });
    queryClient.invalidateQueries({ queryKey: ['/api/customer/tasks'] });
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
    });
  }, [queryClient, toast]);

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
            <CardTitle>Dashboard Access Required</CardTitle>
            <CardDescription>
              Please use the link from your email or QR code to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full" data-testid="button-go-home">
              Go to Homepage
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
            <CardTitle>Dashboard Not Found</CardTitle>
            <CardDescription>
              Unable to load your household dashboard. Please check your link or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full" data-testid="button-go-home">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl" data-testid="text-welcome-name">
                  Welcome, {household.firstName}!
                </h1>
                <p className="text-blue-100 text-sm" data-testid="text-home-info">
                  {household.homeType} in {household.city}, {household.state}
                </p>
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
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              <ListTodo className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="appliances" data-testid="tab-appliances">
              <Settings className="h-4 w-4 mr-2" />
              Appliances
            </TabsTrigger>
            <TabsTrigger value="details" data-testid="tab-details">
              <User className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card data-testid="stat-total">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <ListTodo className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-completed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-pending">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-overdue">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
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
                      Your Maintenance Tasks
                    </CardTitle>
                    <CardDescription>
                      Track and complete your personalized home maintenance schedule
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {household && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCalendar(household.id)}
                        disabled={isDownloadingCalendar || stats.pending === 0}
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
                    <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks found in this category.</p>
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
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
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
              <HouseholdDetails 
                household={household}
                onEdit={() => {
                  toast({
                    title: "Edit Feature",
                    description: "Household editing will be available soon.",
                  });
                }}
              />
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
    </div>
  );
}
