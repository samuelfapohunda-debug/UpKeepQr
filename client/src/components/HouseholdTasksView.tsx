import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthToken } from '@/contexts/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ListTodo,
  ChevronLeft,
  Calendar
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

export function HouseholdTasksView({ householdId, onBack }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span data-testid={`text-due-date-${task.id}`}>
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
