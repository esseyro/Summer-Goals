const CACHE = 'summer-goals-v2';
const APP = '/Summer-Goals/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([APP, APP + 'index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Opening the app: try the internet first so updates arrive,
  // otherwise use the saved copy whatever the exact address is
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(APP, res.clone()));
        return res;
      }).catch(() => caches.match(APP))
    );
    return;
  }

  // Sync with JSONBin always needs the internet
  if (url.hostname.includes('jsonbin.io')) return;

  // Everything else (fonts etc.): saved copy first, save new ones
  e.respondWith(
    caches.match(req, { ignoreSearch: url.origin === location.origin }).then(cached =>
      cached || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
