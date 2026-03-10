import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (isStandalone) return;
    if (!deferredPrompt && !isIOS) return;

    let pageViewCount = parseInt(sessionStorage.getItem('pwa-page-views') || '0', 10);

    const trackPageView = () => {
      pageViewCount++;
      sessionStorage.setItem('pwa-page-views', String(pageViewCount));
      if (pageViewCount >= 3 && !hasBeenDismissedRecently()) {
        setShowInstallPrompt(true);
      }
    };

    const checkAuth = () => {
      const hasSession = document.cookie.includes('maintcue_session') ||
                         localStorage.getItem('maintcue_admin_token');
      if (hasSession && !hasBeenDismissedRecently()) {
        setTimeout(() => setShowInstallPrompt(true), 5000);
      }
    };

    const handleTaskComplete = () => {
      if (!hasBeenDismissedRecently()) {
        setShowInstallPrompt(true);
      }
    };

    trackPageView();
    checkAuth();

    const observer = new MutationObserver(() => {
      trackPageView();
    });
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: false });
    }

    window.addEventListener('popstate', trackPageView);
    window.addEventListener('maintcue:task-completed', handleTaskComplete);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', trackPageView);
      window.removeEventListener('maintcue:task-completed', handleTaskComplete);
    };
  }, [deferredPrompt, isIOS, isStandalone]);

  const hasBeenDismissedRecently = (): boolean => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return false;
    const dismissedTime = parseInt(dismissed);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedTime < sevenDays;
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showInstallPrompt) return null;

  if (isIOS) {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-green-500 rounded-lg shadow-2xl p-4 z-50 animate-slide-up"
        data-testid="install-pwa-ios"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
          data-testid="button-dismiss-install"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <Share className="text-white" size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Install MaintCue
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Install this app on your iPhone: tap <Share className="inline w-4 h-4" /> then "Add to Home Screen"
            </p>

            <button
              onClick={handleDismiss}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              data-testid="button-got-it-install"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-green-500 rounded-lg shadow-2xl p-4 z-50 animate-slide-up"
      data-testid="install-pwa-prompt"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
        data-testid="button-dismiss-install"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
          <Download className="text-white" size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            Install MaintCue
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get maintenance reminders even when offline. Install for quick access and push notifications.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              data-testid="button-install-pwa"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-testid="button-not-now-install"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
