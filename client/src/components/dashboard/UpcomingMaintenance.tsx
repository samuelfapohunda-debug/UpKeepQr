import { TaskCard } from './TaskCard';

interface Task {
  id: string;
  name: string;
  appliance: string;
  dueDate: Date;
  status: 'upcoming' | 'overdue';
  instruction?: string;
}

interface UpcomingMaintenanceProps {
  tasks: Task[];
  onViewDetails: (taskId: string) => void;
  onMarkComplete: (taskId: string) => void;
}

export default function UpcomingMaintenance({ 
  tasks, 
  onViewDetails, 
  onMarkComplete 
}: UpcomingMaintenanceProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <section className="mb-8" data-testid="upcoming-maintenance-section">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        📅 Upcoming Maintenance
      </h2>
      
      {sortedTasks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            No upcoming maintenance scheduled in the next 90 days.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onViewDetails={onViewDetails}
              onMarkComplete={onMarkComplete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
