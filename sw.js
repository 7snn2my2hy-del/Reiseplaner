/* Service Worker – macht die Reisen-App offline verfügbar.
   Strategie:
   - App-Datei (index.html / Navigation): NETWORK-FIRST, damit Updates sofort ankommen.
     Nur wenn kein Netz da ist, kommt die zuletzt gespeicherte Version aus dem Cache.
   - Übrige Dateien: cache-first (schnell), werden im Hintergrund aufgefrischt.
   Bei Änderungen an der App die Versionsnummer erhöhen (reisen-v2 -> reisen-v3 ...). */
const CACHE = 'reisen-v2';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Cloud-Backup läuft über die GitHub-API und darf NIE aus dem Cache kommen.
  if (req.url.includes('api.github.com')) return;

  const isAppShell = req.mode === 'navigate' ||
                     req.destination === 'document' ||
                     /\/(index\.html)?$/.test(new URL(req.url).pathname);

  if (isAppShell) {
    // NETWORK-FIRST mit 3s-Timeout: neueste Version laden, aber bei langsamem/keinem Netz
    // sofort die gespeicherte Version ausliefern (kein Hängen beim Start).
    event.respondWith((async () => {
      const cachedPromise = caches.match('./index.html').then(r => r || caches.match('./'));
      try {
        const res = await Promise.race([
          fetch(req).then(r => {
            if (r && r.status === 200) {
              const copy = r.clone();
              caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
            }
            return r;
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        return res;
      } catch (e) {
        const cached = await cachedPromise;
        return cached || fetch(req);
      }
    })());
    return;
  }

  // Übrige Dateien: cache-first, im Hintergrund auffrischen
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
