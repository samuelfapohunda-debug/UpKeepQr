interface RemindersStatusProps {
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export default function RemindersStatus({ 
  emailEnabled, 
  smsEnabled 
}: RemindersStatusProps) {
  return (
    <section className="mb-8" data-testid="reminders-status-section">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🔔 Reminders & Notifications
      </h2>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Email Reminders</span>
            <span className={`flex items-center gap-2 ${
              emailEnabled ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              {emailEnabled ? '✅' : '❌'}
              <span className="font-medium">
                {emailEnabled ? 'On' : 'Off'}
              </span>
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">SMS Reminders</span>
            <span className={`flex items-center gap-2 ${
              smsEnabled ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              {smsEnabled ? '✅' : '❌'}
              <span className="font-medium">
                {smsEnabled ? 'On' : 'Off'}
              </span>
            </span>
          </div>
        </div>
        
        <button 
          className="w-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-3 px-6 rounded-lg transition-colors min-h-[44px]"
          data-testid="button-manage-reminders"
        >
          Manage Reminders
        </button>
      </div>
    </section>
  );
}
