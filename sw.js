// Sayfayı internetsiz açılır yapar: önce ağdan dener (3 sn), olmazsa kayıtlı kopyayı verir.
const CACHE = 'ayak-v2';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctl = new AbortController();
      const tm = setTimeout(() => ctl.abort(), 3000);
      const res = await fetch(e.request, { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(tm);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch (_) {
      return (await cache.match(e.request, { ignoreSearch: true })) ||
             (await cache.match('./index.html')) || Response.error();
    }
  })());
});
