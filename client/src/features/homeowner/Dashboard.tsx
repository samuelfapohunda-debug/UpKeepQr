import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, Clock, AlertCircle, Home, QrCode, Bell, Calendar, ChevronRight, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardTask {
  id: string;
  name: string;
  dueDate: string;
  instruction: string;
  appliance: string;
  status?: 'upcoming' | 'overdue';
}

interface CompletedTask {
  id: string;
  name: string;
  completedDate: string;
  completedBy: string;
  notes: string;
}

interface QRAsset {
  id: string;
  label: string;
  location: string;
  activatedAt: string;
}

interface DashboardData {
  property: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  status: 'tasks_due' | 'on_track' | 'overdue';
  nextTask: DashboardTask | null;
  upcomingTasks: DashboardTask[];
  completedTasks: CompletedTask[];
  reminders: {
    email: boolean;
    sms: boolean;
  };
  qrAssets: QRAsset[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDueBadge(dueDate: string) {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
  }
  if (diffDays <= 1) {
    return <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">Due Soon</Badge>;
  }
  return <Badge variant="secondary" className="text-xs">Upcoming</Badge>;
}

export default function HomeownerDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard', token],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?token=${encodeURIComponent(token!)}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }
      return response.json();
    },
    enabled: !!token,
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/dashboard/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Task completed!',
        description: 'Great job keeping up with your home maintenance.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard', token] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark task as complete. Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2" data-testid="text-access-required">Access Required</h1>
            <p className="text-muted-foreground mb-6">
              Please use the link from your email or scan your QR code to access your dashboard.
            </p>
            <Button asChild className="min-h-[48px]">
              <a href="/" data-testid="link-homepage">Go to Homepage</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't load your dashboard data. Please try again or contact support.
            </p>
            <Button onClick={() => window.location.reload()} className="min-h-[48px]">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { property, nextTask, upcomingTasks, completedTasks, reminders, qrAssets } = data;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold" data-testid="text-dashboard-title">{property.name}</h1>
              <p className="text-emerald-100 text-sm">
                {property.address.street}, {property.address.city}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-4">
        {nextTask && (
          <Card className="mb-6 border-l-4 border-l-amber-500 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Next Priority Task
                </CardTitle>
                {getDueBadge(nextTask.dueDate)}
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg mb-1" data-testid="text-next-task-name">{nextTask.name}</h3>
              <p className="text-muted-foreground text-sm mb-1">{nextTask.appliance}</p>
              <p className="text-sm mb-4">{nextTask.instruction}</p>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => completeMutation.mutate(nextTask.id)}
                  disabled={completeMutation.isPending}
                  className="min-h-[44px] flex-1 sm:flex-none"
                  data-testid="button-mark-complete"
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Mark Complete
                </Button>
                <Button 
                  variant="outline" 
                  className="min-h-[44px] flex-1 sm:flex-none"
                  asChild
                  data-testid="button-request-pro"
                >
                  <a href="/pro-request">
                    <Wrench className="w-4 h-4 mr-2" />
                    Request a Pro
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="upcoming" className="min-h-[44px]" data-testid="tab-upcoming">
              <Calendar className="w-4 h-4 mr-1.5 hidden sm:block" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="min-h-[44px]" data-testid="tab-completed">
              <CheckCircle2 className="w-4 h-4 mr-1.5 hidden sm:block" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="assets" className="min-h-[44px]" data-testid="tab-assets">
              <QrCode className="w-4 h-4 mr-1.5 hidden sm:block" />
              QR Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingTasks.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                    <p>You're all caught up! No upcoming tasks.</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {upcomingTasks.map((task) => (
                      <li key={task.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.name}</h4>
                            <p className="text-sm text-muted-foreground">{task.appliance}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm text-muted-foreground">{formatDate(task.dueDate)}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Completed Tasks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {completedTasks.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>No completed tasks yet. Complete your first task to see it here!</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {completedTasks.map((task) => (
                      <li key={task.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span className="truncate">{task.name}</span>
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.completedBy === 'self' ? 'Completed by you' : `By ${task.completedBy}`}
                            </p>
                            {task.notes && (
                              <p className="text-sm text-muted-foreground mt-1 italic">"{task.notes}"</p>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground flex-shrink-0">
                            {new Date(task.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your QR Codes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {qrAssets.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No QR codes activated yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {qrAssets.map((asset) => (
                      <li key={asset.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2 rounded-lg">
                            <QrCode className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{asset.label}</h4>
                            <p className="text-sm text-muted-foreground">{asset.location}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Reminder Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${reminders.email ? 'bg-emerald-500' : 'bg-muted'}`} />
                <span className="text-sm">Email reminders {reminders.email ? 'enabled' : 'disabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${reminders.sms ? 'bg-emerald-500' : 'bg-muted'}`} />
                <span className="text-sm">SMS reminders {reminders.sms ? 'enabled' : 'disabled'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
