// Sarfy - Service Worker for 100% Offline Capability
const CACHE_NAME = 'sarfy-cache-v4';
const ASSETS_TO_CACHE = [
  './',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // تخزين الأصول واحدة واحدة مع تجاهل أي ملف يفشل (مثل 403)
      // حتى لا يفشل تنصيب الـ Service Worker بالكامل
      return Promise.all(
        ASSETS_TO_CACHE.map(url =>
          cache.add(new Request(url, { cache: 'reload' })).catch(err => {
            console.warn('[SW] تعذر تخزين الأصل:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // عدم تخزين أي طلبات للواجهة البرمجية api.php في الكاش لضمان تحديث البيانات لحظياً
  if (event.request.url.includes('api.php')) {
    return;
  }

  // صفحات التطبيق (index.php): الشبكة أولاً لتصل التحديثات للمستخدمين فوراً، والنسخة المخزنة عند انقطاع الإنترنت
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./', responseToCache));
        }
        return networkResponse;
      }).catch(() => caches.match('./'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // إذا كان الجهاز غير متصل بالإنترنت، استرجع الصفحة الرئيسية المخزنة
        if (event.request.mode === 'navigate') {
          return caches.match('./');
        }
      });
    })
  );
});
