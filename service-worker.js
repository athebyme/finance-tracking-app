// Service Worker для FinTracker PWA
// Версия кэша - увеличивайте при обновлении файлов
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `fintracker-${CACHE_VERSION}`;

// Файлы для кэширования при установке
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        // Активировать новый Service Worker сразу
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Удаляем старые кэши
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('fintracker-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        // Начать контролировать все открытые вкладки сразу
        return self.clients.claim();
      })
  );
});

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }

  // Игнорируем chrome-extension и другие протоколы
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Стратегия кэширования: Cache First для статических файлов
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Если нет в кэше - запрашиваем из сети
        return fetch(request)
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Клонируем ответ (stream можно прочитать только один раз)
            const responseToCache = response.clone();

            // Кэшируем новый ресурс
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Кэшируем только статические ресурсы (не API и т.д.)
                if (shouldCache(url)) {
                  console.log('[Service Worker] Caching new resource:', request.url);
                  cache.put(request, responseToCache);
                }
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);

            // Если это HTML страница и мы офлайн - показываем офлайн страницу
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }

            // Для других ресурсов возвращаем ошибку
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Функция для определения, нужно ли кэшировать URL
function shouldCache(url) {
  // Кэшируем только локальные файлы и некоторые внешние ресурсы
  const hostname = url.hostname;
  const pathname = url.pathname;

  // Локальные файлы
  if (hostname === self.location.hostname) {
    return true;
  }

  // Google Fonts
  if (hostname === 'fonts.googleapis.com' || hostname === 'fonts.gstatic.com') {
    return true;
  }

  // CDN библиотеки
  if (hostname === 'cdn.jsdelivr.net') {
    return true;
  }

  return false;
}

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('fintracker-')) {
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Периодическая синхронизация (если поддерживается)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Функция синхронизации транзакций (для будущего использования с backend)
async function syncTransactions() {
  console.log('[Service Worker] Syncing transactions...');
  // TODO: Реализовать синхронизацию с backend когда будет API
  return Promise.resolve();
}

// Push уведомления (для будущего использования)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'FinTracker';
  const options = {
    body: data.body || 'У вас новое уведомление',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'notification',
    requireInteraction: false,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[Service Worker] Loaded');
