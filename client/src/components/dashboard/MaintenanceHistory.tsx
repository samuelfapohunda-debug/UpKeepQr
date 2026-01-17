interface CompletedTask {
  id: string;
  name: string;
  completedDate: Date;
  completedBy: 'self' | string;
  notes?: string;
}

interface MaintenanceHistoryProps {
  completedTasks: CompletedTask[];
  onViewDetails: (taskId: string) => void;
}

export default function MaintenanceHistory({ 
  completedTasks, 
  onViewDetails 
}: MaintenanceHistoryProps) {
  return (
    <section className="mb-8" data-testid="maintenance-history-section">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        📜 Maintenance History
      </h2>
      
      {completedTasks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            No completed tasks yet. Your history will appear here once you complete maintenance.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedTasks.map(task => (
            <div 
              key={task.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:border-emerald-300 transition-colors"
              data-testid={`card-completed-${task.id}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl">✓</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {task.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Completed: {new Date(task.completedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    By: {task.completedBy === 'self' ? 'You' : task.completedBy}
                  </p>
                </div>
                <button
                  onClick={() => onViewDetails(task.id)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium min-h-[44px] px-2"
                  data-testid={`button-view-history-${task.id}`}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
