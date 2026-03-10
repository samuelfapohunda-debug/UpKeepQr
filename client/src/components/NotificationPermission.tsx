import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission } from '../lib/notifications';

export function NotificationPermission() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) return;

    setPermission(Notification.permission);

    const checkAuth = () => {
      const hasSession = document.cookie.includes('maintcue_session') ||
                         localStorage.getItem('maintcue_admin_token');
      const dismissed = localStorage.getItem('notification-prompt-dismissed');

      if (hasSession && Notification.permission === 'default' && !dismissed) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 60000);
      }
    };

    checkAuth();
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || permission !== 'default') return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-blue-500 rounded-lg shadow-2xl p-4 z-50 animate-slide-down"
      data-testid="notification-permission-prompt"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
        data-testid="button-dismiss-notification"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
          <Bell className="text-white" size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            Enable Reminders
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get smart notifications when maintenance tasks are due. Never miss important home care!
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              data-testid="button-enable-notifications"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-testid="button-later-notification"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
