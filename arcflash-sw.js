// Increment this namespace whenever a routed application release is published.
// A new namespace removes obsolete PWA shells which may not know newer routes
// such as /assistant.
const CACHE = "se-afc-shell-v2";
const SHELL = ["/", "/assistant", "/references", "/manifest.webmanifest"];
const PRECACHE = self.__WB_MANIFEST || [];
const PRECACHE_URLS = [...new Set([...SHELL, ...PRECACHE.map(entry => entry.url)])];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(PRECACHE_URLS.map(url => cache.add(url).catch(() => undefined)))));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    if (!response.ok) {
      const cached = await caches.match(event.request);
      return cached || (event.request.mode === "navigate" ? caches.match("/") : response);
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === "navigate" ? caches.match("/") : undefined))));
});
