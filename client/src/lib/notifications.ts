const NOTIFICATION_RATE_LIMITS = {
  MAX_PER_DAY: 3,
  MAX_PER_TASK: 1,
  COOLDOWN_HOURS: 4
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      await subscribeToPushNotifications();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

async function subscribeToPushNotifications(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

    if (!vapidPublicKey) {
      console.warn('VAPID public key not configured - push notifications disabled');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function showLocalNotification(
  title: string,
  options?: NotificationOptions,
  taskId?: string
): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  if (!checkNotificationRateLimit(taskId)) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    ...options
  });

  trackNotification(taskId);

  return true;
}

function checkNotificationRateLimit(taskId?: string): boolean {
  const today = new Date().toDateString();

  const history = JSON.parse(localStorage.getItem('notification-history') || '{}');

  const todayCount = (history[today] || []).length;
  if (todayCount >= NOTIFICATION_RATE_LIMITS.MAX_PER_DAY) {
    return false;
  }

  if (taskId) {
    const taskNotifications = (history[today] || []).filter((n: any) => n.taskId === taskId);
    if (taskNotifications.length >= NOTIFICATION_RATE_LIMITS.MAX_PER_TASK) {
      return false;
    }

    const lastNotification = taskNotifications[taskNotifications.length - 1];
    if (lastNotification) {
      const cooldownMs = NOTIFICATION_RATE_LIMITS.COOLDOWN_HOURS * 60 * 60 * 1000;
      if (Date.now() - lastNotification.timestamp < cooldownMs) {
        return false;
      }
    }
  }

  return true;
}

function trackNotification(taskId?: string): void {
  const today = new Date().toDateString();
  const history = JSON.parse(localStorage.getItem('notification-history') || '{}');

  if (!history[today]) {
    history[today] = [];
  }

  history[today].push({
    timestamp: Date.now(),
    taskId: taskId || null
  });

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  Object.keys(history).forEach(date => {
    const dateTimestamp = new Date(date).getTime();
    if (dateTimestamp < sevenDaysAgo) {
      delete history[date];
    }
  });

  localStorage.setItem('notification-history', JSON.stringify(history));
}
