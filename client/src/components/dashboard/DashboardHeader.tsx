import { Settings, HelpCircle } from 'lucide-react';

interface DashboardHeaderProps {
  propertyName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: 'caught_up' | 'tasks_due' | 'overdue';
}

export default function DashboardHeader({ 
  propertyName, 
  address, 
  status 
}: DashboardHeaderProps) {
  const statusConfig = {
    caught_up: {
      icon: '✅',
      text: 'All caught up',
      color: 'text-emerald-600'
    },
    tasks_due: {
      icon: '⚠️',
      text: 'Tasks due',
      color: 'text-amber-600'
    },
    overdue: {
      icon: '🔴',
      text: 'Overdue tasks',
      color: 'text-red-600'
    }
  };

  const currentStatus = statusConfig[status];

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              🏠 {propertyName}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              <span className="md:hidden">
                {address.city}, {address.state}
              </span>
              <span className="hidden md:inline">
                {address.street}, {address.city}, {address.state} {address.zip}
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Settings"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Help"
              data-testid="button-help"
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 ${currentStatus.color} font-medium`} data-testid="status-indicator">
          <span>{currentStatus.icon}</span>
          <span>{currentStatus.text}</span>
        </div>
      </div>
    </header>
  );
}
