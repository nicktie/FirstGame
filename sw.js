const CACHE = 'wanees-v6';
const RUNTIME = 'wanees-runtime-v5';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './questions.json', './wanees-logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never intercept realtime / analytics traffic
  if (/firebaseio|firebasedatabase|google-analytics|googletagmanager/.test(url.hostname)) return;

  // HTML: network-first so updates always appear when online; cache fallback when offline
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Stale-while-revalidate for fonts + Firebase SDK + same-origin assets
  // (instant from cache, but refresh in background so updates land on next load)
  const isCacheable = url.origin === location.origin || /gstatic|googleapis/.test(url.hostname);
  if (isCacheable) {
    e.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res.ok) caches.open(RUNTIME).then(c => c.put(req, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
  // Anything else: pass-through
});
