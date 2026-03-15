import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api-config';

type PermissionState = 'unsupported' | 'denied' | 'default' | 'granted';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export default function PushNotificationSetup() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as PermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);

      if (perm !== 'granted') {
        setError('Notification permission was denied. Enable it in your browser settings.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        setError('Push notifications are not configured.');
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();

      await fetch(`${API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent.slice(0, 200),
        }),
      });

      setIsSubscribed(true);
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      setError('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error('Push unsubscription failed:', err);
      setError('Failed to disable notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/push/test`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Test failed');
    } catch {
      setError('Test notification failed. Check browser console.');
    } finally {
      setIsLoading(false);
    }
  };

  if (permission === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        Push notifications are not supported in this browser.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {isSubscribed ? (
          <>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Notifications enabled
            </div>
            <Button variant="outline" size="sm" onClick={handleTest} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
              Send test
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisable} disabled={isLoading}>
              <BellOff className="h-4 w-4 mr-1" />
              Disable
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={isLoading || permission === 'denied'}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <Bell className="h-4 w-4 mr-2" />
            }
            Enable maintenance alerts
          </Button>
        )}
      </div>

      {permission === 'denied' && (
        <p className="text-xs text-destructive">
          Notifications are blocked. Open browser settings and allow notifications for this site.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
