import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/lib/api-config";
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
  LogOut
} from "lucide-react";

interface Task {
  id: number;
  taskName: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string;
  frequencyMonths: number;
}

interface Household {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  homeType: string;
  city: string;
  state: string;
  zip: string;
}

interface TasksResponse {
  tasks: Task[];
  summary?: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export default function CustomerDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/customer/household'] });
    queryClient.invalidateQueries({ queryKey: ['/api/customer/tasks'] });
  };

  const getTaskStats = (): TaskStats => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const overdue = tasks.filter(t => t.status === "overdue").length;

    return { total, completed, pending, overdue };
  };

  const getCategories = (): string[] => {
    const categories = new Set(tasks.map(t => t.category));
    return ["all", ...Array.from(categories)];
  };

  const filterTasks = (category: string): Task[] => {
    if (category === "all") return tasks;
    return tasks.filter(t => t.category.toLowerCase() === category.toLowerCase());
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

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "Not scheduled";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
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

  const stats = getTaskStats();
  const filteredTasks = filterTasks(selectedCategory);
  const categories = getCategories();

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
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter:</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="capitalize text-xs sm:text-sm"
                    data-testid={`tab-${category}`}
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-0">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
      </div>
    </div>
  );
}
