const CACHE_NAME = '2x-okuma-pwa-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script_core.js',
  './script_data.js',
  './script_stages.js',
  './script_exercises.js',
  './site_metinleri.json',
  './metinler.db',
  './manifest.json',
  './2x.png',
  './sn.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {}
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  const reqUrl = new URL(e.request.url);
  const isExternalApi =
    reqUrl.hostname.includes('firebaseio.com') ||
    reqUrl.hostname.includes('firebasedatabase.app') ||
    reqUrl.hostname.includes('formsubmit.co') ||
    reqUrl.hostname.includes('googleapis.com') ||
    reqUrl.hostname.includes('gstatic.com') ||
    reqUrl.hostname.includes('youtube.com') ||
    reqUrl.hostname.includes('youtube-nocookie.com') ||
    reqUrl.hostname.includes('ytimg.com') ||
    reqUrl.hostname.includes('embedly.com');

  if (isExternalApi) {
    return;
  }

  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((networkRes) => {
        if (networkRes && networkRes.ok && e.request.method === 'GET') {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
        }
        return networkRes;
      })
      .catch(() => caches.match(e.request))
  );
});
