interface Task {
  id: string;
  name: string;
  dueDate: Date;
  instruction: string;
  appliance?: string;
}

interface NextActionPanelProps {
  nextTask: Task | null;
  upcomingTask: Task | null;
  onMarkComplete: (taskId: string) => void;
  isCompleting?: boolean;
}

export default function NextActionPanel({ 
  nextTask, 
  upcomingTask,
  onMarkComplete,
  isCompleting 
}: NextActionPanelProps) {
  const getRelativeDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (nextTask) {
    const taskDate = new Date(nextTask.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    const isOverdue = taskDate < today;
    
    return (
      <section className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6 mb-6" data-testid="next-action-panel">
        <h2 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
          🎯 Next Up
        </h2>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-next-task-name">
          {nextTask.name}
        </h3>
        
        <p className={`text-sm font-medium mb-4 ${
          isOverdue ? 'text-red-600' : 'text-emerald-700'
        }`} data-testid="text-next-task-due">
          Due: {getRelativeDate(nextTask.dueDate)}
        </p>
        
        <p className="text-gray-700 mb-6">
          {nextTask.instruction}
        </p>
        
        <button
          onClick={() => onMarkComplete(nextTask.id)}
          disabled={isCompleting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          data-testid="button-mark-complete"
        >
          {isCompleting ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Completing...</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>Mark as Done</span>
            </>
          )}
        </button>
      </section>
    );
  }
  
  return (
    <section className="bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-lg p-6 mb-6 text-center" data-testid="all-caught-up-panel">
      <h2 className="text-2xl font-bold text-emerald-900 mb-2">
        ✨ You're All Set!
      </h2>
      
      <p className="text-gray-700 mb-6">
        No maintenance due in the next week. You're doing great!
      </p>
      
      {upcomingTask && (
        <div className="bg-white rounded-lg p-4 text-left">
          <p className="text-sm text-gray-600 mb-1">Next Task:</p>
          <p className="font-semibold text-gray-900">
            {upcomingTask.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Due: {getRelativeDate(upcomingTask.dueDate)}
          </p>
        </div>
      )}
    </section>
  );
}
