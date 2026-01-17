interface TaskCardProps {
  task: {
    id: string;
    name: string;
    appliance: string;
    dueDate: Date;
    status: 'upcoming' | 'overdue';
    instruction?: string;
  };
  onViewDetails: (taskId: string) => void;
  onMarkComplete: (taskId: string) => void;
}

export function TaskCard({ task, onViewDetails, onMarkComplete }: TaskCardProps) {
  const isOverdue = task.status === 'overdue';
  
  return (
    <div 
      className={`border rounded-lg p-4 ${
        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}
      data-testid={`card-task-${task.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-lg">
          {task.name}
        </h3>
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          isOverdue 
            ? 'bg-red-100 text-red-700' 
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {isOverdue ? 'Overdue' : 'Upcoming'}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        {task.appliance}
      </p>
      
      <p className={`text-sm font-medium mb-4 ${
        isOverdue ? 'text-red-600' : 'text-gray-700'
      }`}>
        Due: {new Date(task.dueDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </p>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => onViewDetails(task.id)}
          className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors min-h-[44px]"
          data-testid={`button-view-details-${task.id}`}
        >
          View Details
        </button>
        <button
          onClick={() => onMarkComplete(task.id)}
          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm min-h-[44px] px-2"
          data-testid={`button-mark-complete-${task.id}`}
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}
