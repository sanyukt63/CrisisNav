const CACHE_NAME = 'crisisnav-v2';
const STATIC_CACHE = 'crisisnav-static-v1';
const IMAGE_CACHE = 'crisisnav-images-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './signin.html',
  './signup.html',
  './profile.html',
  './my-crises.html',
  './other-crises.html',
  './reports.html',
  './settings.html',
  './style.css',
  './app.js',
  './auth_service.js',
  './i18n.js',
  './translations.js',
  './manifest.json',
  './assets/logo.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Pre-caching Static Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (![STATIC_CACHE, IMAGE_CACHE, CACHE_NAME].includes(cache)) {
            console.log('Service Worker: Clearing Old Cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. External Assets (Fonts, Icons from CDNs) - Cache First
  if (url.origin.includes('fonts.googleapis.com') || 
      url.origin.includes('fonts.gstatic.com') || 
      url.origin.includes('unpkg.com')) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Images - Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(IMAGE_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // 3. HTML Pages - Network First, then Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request) || caches.match('./index.html');
      })
    );
    return;
  }

  // 4. Everything Else (CSS, JS) - Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        return caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
      return cachedResponse || fetchPromise;
    })
  );
});

