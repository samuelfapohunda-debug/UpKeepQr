import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getAuthToken } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ListTodo,
  ChevronLeft,
  Calendar,
  Check,
  Download,
  Loader2
} from 'lucide-react';

interface TaskData {
  id: string;
  householdId: string;
  taskId: number;
  dueDate: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  taskName: string;
  taskDescription: string;
  category: string;
  priority: 'high' | 'medium' | 'low' | number;
  frequencyMonths: number;
}

interface TasksSummary {
  total: number;
  pending: number;
  overdue: number;
  completed: number;
}

interface HouseholdTasksResponse {
  householdId: string;
  householdName: string;
  summary: TasksSummary;
  tasks: TaskData[];
}

interface Props {
  householdId: string;
  onBack?: () => void;
}

interface CompleteTaskFormData {
  completionDate: string;
  cost: string;
  serviceProvider: string;
  notes: string;
  partsReplaced: string;
}

export function HouseholdTasksView({ householdId, onBack }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [isDownloadingCalendar, setIsDownloadingCalendar] = useState(false);
  const [formData, setFormData] = useState<CompleteTaskFormData>({
    completionDate: new Date().toISOString().split('T')[0],
    cost: '',
    serviceProvider: '',
    notes: '',
    partsReplaced: ''
  });
  
  const { toast } = useToast();
  
  const handleDownloadCalendar = async () => {
    try {
      setIsDownloadingCalendar(true);
      const token = getAuthToken();
      
      const response = await fetch(`/api/calendar/household/${householdId}/tasks.ics`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate calendar' }));
        throw new Error(error.error || 'Failed to generate calendar file');
      }
      
      const blob = await response.blob();
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
        description: "Open the .ics file to import tasks into your calendar app.",
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
  };
  
  const { data, isLoading, error } = useQuery<HouseholdTasksResponse>({
    queryKey: ['/api/admin/households', householdId, 'tasks'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const res = await fetch(`/api/admin/households/${householdId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired, please log in again');
        throw new Error('Failed to fetch tasks');
      }
      return res.json();
    },
    retry: false
  });
  
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const parsedCost = formData.cost ? parseFloat(formData.cost) : undefined;
      const validCost = parsedCost !== undefined && !isNaN(parsedCost) ? parsedCost : undefined;
      
      const payload = {
        completionDate: formData.completionDate,
        cost: validCost,
        serviceProvider: formData.serviceProvider.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        partsReplaced: formData.partsReplaced.trim() || undefined
      };
      
      const res = await fetch(`/api/admin/households/${householdId}/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to complete task');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Task Completed',
        description: `"${selectedTask?.taskName}" has been marked as complete.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/households', householdId, 'tasks'] });
      setCompleteDialogOpen(false);
      setSelectedTask(null);
      setFormData({
        completionDate: new Date().toISOString().split('T')[0],
        cost: '',
        serviceProvider: '',
        notes: '',
        partsReplaced: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleOpenCompleteDialog = (task: TaskData) => {
    setSelectedTask(task);
    setFormData({
      completionDate: new Date().toISOString().split('T')[0],
      cost: '',
      serviceProvider: '',
      notes: '',
      partsReplaced: ''
    });
    setCompleteDialogOpen(true);
  };
  
  const handleSubmitComplete = () => {
    if (selectedTask) {
      completeTaskMutation.mutate(selectedTask.id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="p-6" data-testid="container-tasks-error">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground" data-testid="text-tasks-error">Failed to load tasks for this household.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { summary, tasks, householdName } = data;
  
  const filteredTasks = selectedCategory 
    ? tasks.filter(t => t.category === selectedCategory)
    : tasks;
  
  const categories = [...new Set(tasks.map(t => t.category))];
  
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low' | number) => {
    const normalizedPriority = typeof priority === 'number' 
      ? (priority === 1 ? 'high' : priority === 2 ? 'medium' : 'low')
      : priority;
      
    switch (normalizedPriority) {
      case 'high':
        return <Badge variant="destructive" data-testid={`badge-priority-high`}>High</Badge>;
      case 'medium':
        return <Badge variant="secondary" data-testid={`badge-priority-medium`}>Medium</Badge>;
      case 'low':
        return <Badge variant="outline" data-testid={`badge-priority-low`}>Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    switch (normalizedStatus) {
      case 'pending':
        return <Badge variant="secondary" data-testid={`badge-status-pending`}><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive" data-testid={`badge-status-overdue`}><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'completed':
        return <Badge className="bg-green-600 text-white" data-testid={`badge-status-completed`}><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <div className="space-y-6 p-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          data-testid="button-back-to-list"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to List
        </Button>
      )}
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold" data-testid="text-household-name">
          Tasks for {householdName}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCalendar}
          disabled={isDownloadingCalendar || summary.pending === 0}
          data-testid="button-sync-calendar"
        >
          {isDownloadingCalendar ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isDownloadingCalendar ? 'Downloading...' : 'Sync to Calendar'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-summary-total">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">{summary.total}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-summary-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">{summary.pending}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-summary-overdue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-overdue-count">{summary.overdue}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-summary-completed">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-count">{summary.completed}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          data-testid="button-filter-all"
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            data-testid={`button-filter-${cat.toLowerCase()}`}
          >
            {cat}
          </Button>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task List ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center" data-testid="text-no-tasks">
              No tasks found for this household.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div 
                  key={task.id}
                  className="flex flex-wrap items-start justify-between gap-4 p-4 border rounded-md"
                  data-testid={`task-row-${task.id}`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium" data-testid={`text-task-name-${task.id}`}>
                        {task.taskName}
                      </span>
                      {getPriorityBadge(task.priority)}
                      <Badge variant="outline">{task.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-task-desc-${task.id}`}>
                      {task.taskDescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span data-testid={`text-due-date-${task.id}`}>
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </div>
                    {getStatusBadge(task.status)}
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCompleteDialog(task)}
                        data-testid={`button-complete-${task.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Complete Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Record the details of your completed maintenance task
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-8 mt-4">
              {/* Section 1: Task Information (Read-Only) */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Task Information
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Details about the maintenance task
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Task Name
                      </div>
                      <div className="text-base font-semibold text-gray-900 dark:text-gray-100" data-testid="text-task-name-display">
                        {selectedTask.taskName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                          Due Date:
                        </span>
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100" data-testid="text-due-date-display">
                          {formatDate(selectedTask.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Completion Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Completion Details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Record when and how the task was completed
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Completion Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.completionDate}
                      onChange={e => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                      className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="input-completion-date"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Service Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Service Information
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Track costs and service provider details
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Cost ($)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.cost}
                        onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                        className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="input-cost"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Service Provider (if any)
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g., ABC Plumbing"
                        value={formData.serviceProvider}
                        onChange={e => setFormData(prev => ({ ...prev, serviceProvider: e.target.value }))}
                        className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="input-service-provider"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Maintenance Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Maintenance Details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Record parts replaced and additional notes
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-6">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Parts Replaced
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g., HVAC filter 20x25x1"
                      value={formData.partsReplaced}
                      onChange={e => setFormData(prev => ({ ...prev, partsReplaced: e.target.value }))}
                      className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="input-parts-replaced"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Notes
                    </Label>
                    <Textarea
                      rows={4}
                      placeholder="Any additional notes about the maintenance performed..."
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      data-testid="input-notes"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
              data-testid="button-cancel-complete"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComplete}
              disabled={completeTaskMutation.isPending}
              data-testid="button-submit-complete"
            >
              {completeTaskMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Mark Complete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
