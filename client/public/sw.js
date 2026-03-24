const BUILD_VERSION = self.__BUILD_VERSION__ || '2026-03-24';
const CACHE_NAME = `maintcue-static-${BUILD_VERSION}`;
const RUNTIME_CACHE = `maintcue-runtime-${BUILD_VERSION}`;

console.log(`[Service Worker] Version: ${BUILD_VERSION}`);

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', BUILD_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
        reportError('sw_install_failed', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version:', BUILD_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => self.clients.claim())
    .then(() => {
      console.log('[Service Worker] Activation complete');
    })
    .catch(error => {
      console.error('[Service Worker] Activation failed:', error);
      reportError('sw_activate_failed', error);
    })
  );
});

function isApiRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/v1/') ||
    url.pathname.startsWith('/graphql') ||
    url.pathname.startsWith('/functions/') ||
    request.method !== 'GET'
  );
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|gif)$/)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  if (isApiRequest(request)) {
    if (request.method !== 'GET') {
      const clonedRequest = request.clone();
      event.respondWith(
        clonedRequest.text().then(bodyText => {
          const reqMeta = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: bodyText
          };

          return fetch(request).catch(async () => {
            await queueOfflineRequest(reqMeta);

            try {
              await self.registration.sync.register('sync-offline-requests');
              console.log('[Background Sync] Registered sync event');
            } catch (syncError) {
              console.warn('[Background Sync] Registration failed:', syncError);
            }

            return new Response(
              JSON.stringify({
                queued: true,
                message: 'Saved offline - will sync when connected'
              }),
              {
                status: 202,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
      );
    } else {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(
            JSON.stringify({
              error: 'Offline - please try again when connected'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
    }
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(error => {
          reportError('asset_fetch_failed', error);
          throw error;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || caches.match('/offline.html');
        });
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-requests') {
    console.log('[Background Sync] Sync event triggered');
    event.waitUntil(syncOfflineRequests());
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  console.log('[Push] Notification received:', data);

  const options = {
    body: data.body || 'You have a maintenance task due soon',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'maintenance-reminder',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/dashboard',
      taskId: data.taskId
    },
    actions: [
      { action: 'view', title: 'View Task' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'MaintCue Reminder',
      options
    ).catch(error => {
      reportError('push_notification_failed', error);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || event.action === '') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

async function queueOfflineRequest(requestData) {
  try {
    const db = await openDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');

    await new Promise((resolve, reject) => {
      const req = store.add({
        ...requestData,
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    console.log('[Offline Queue] Request queued:', requestData.url);
  } catch (error) {
    console.error('[Offline Queue] Failed to queue request:', error);
    reportError('queue_request_failed', error);
  }
}

async function syncOfflineRequests() {
  try {
    const db = await openDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');

    const index = store.index('synced');
    const unsyncedRequests = await getAllFromIndex(index, false);

    console.log(`[Background Sync] Found ${unsyncedRequests.length} unsynced requests`);

    for (const req of unsyncedRequests) {
      const maxRetries = 5;

      if (req.retryCount >= maxRetries) {
        console.warn('[Background Sync] Max retries reached, skipping:', req.url);
        continue;
      }

      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body
        });

        if (response.ok) {
          req.synced = true;
          req.syncedAt = Date.now();
          const putTx = db.transaction('offlineQueue', 'readwrite');
          const putStore = putTx.objectStore('offlineQueue');
          await new Promise((resolve, reject) => {
            const r = putStore.put(req);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
          });
          console.log('[Background Sync] Synced request:', req.url);
        } else {
          req.retryCount = (req.retryCount || 0) + 1;
          const putTx = db.transaction('offlineQueue', 'readwrite');
          const putStore = putTx.objectStore('offlineQueue');
          await new Promise((resolve, reject) => {
            const r = putStore.put(req);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
          });
          console.warn(`[Background Sync] Failed (${response.status}), will retry:`, req.url);
        }
      } catch (error) {
        req.retryCount = (req.retryCount || 0) + 1;
        const putTx = db.transaction('offlineQueue', 'readwrite');
        const putStore = putTx.objectStore('offlineQueue');
        await new Promise((resolve, reject) => {
          const r = putStore.put(req);
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        console.error(`[Background Sync] Error (retry ${req.retryCount}/${maxRetries}):`, req.url, error);
        reportError('background_sync_failed', error);
      }
    }

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const cleanTx = db.transaction('offlineQueue', 'readwrite');
    const cleanStore = cleanTx.objectStore('offlineQueue');
    const syncedIndex = cleanStore.index('synced');
    const syncedRequests = await getAllFromIndex(syncedIndex, true);

    for (const req of syncedRequests) {
      if (req.timestamp < sevenDaysAgo) {
        const delTx = db.transaction('offlineQueue', 'readwrite');
        const delStore = delTx.objectStore('offlineQueue');
        await new Promise((resolve, reject) => {
          const r = delStore.delete(req.id);
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        console.log('[Background Sync] Cleaned up old request:', req.id);
      }
    }

    console.log('[Background Sync] Sync complete');
  } catch (error) {
    console.error('[Background Sync] Sync failed:', error);
    reportError('sync_process_failed', error);
  }
}

function getAllFromIndex(index, value) {
  return new Promise((resolve, reject) => {
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MaintCueDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('offlineQueue')) {
        const store = db.createObjectStore('offlineQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('retryCount', 'retryCount', { unique: false });
      }
    };
  });
}

function reportError(errorType, error) {
  console.error(`[Monitoring] ${errorType}:`, error);
}
