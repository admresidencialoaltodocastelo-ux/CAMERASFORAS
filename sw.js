/* Verificador Diário das Câmeras - service worker */
const CACHE = 'vdc-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Banco de dados (Supabase) e login NUNCA saem do cache
  if (url.hostname.endsWith('supabase.co')) return;

  const CDN = /(^|\.)jsdelivr\.net$|(^|\.)cloudflare\.com$/.test(url.hostname);

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });

    if (hit) {
      // responde rápido e atualiza em segundo plano
      fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); }).catch(() => {});
      return hit;
    }

    try {
      const res = await fetch(req);
      if (res && res.ok && (url.origin === self.location.origin || CDN)) {
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
