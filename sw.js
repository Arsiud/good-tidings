// Caches the app, the translation, its notes and related passages so it opens offline. Bump VERSION when files change.
// The family Bible app shares this site (arsiud.github.io), so only caches named "gtb-" are ours to clear.
const VERSION = "gtb-v1";
const FILES = ["./", "index.html", "style.css", "app.js", "chrono.js", "gtb.json", "manifest.json",
               "icon-180.png", "icon-192.png", "icon-512.png",
               ...Array.from({ length: 66 }, (_, book) => `xrefs/${book}.json`),     // related passages, for offline
               ...Array.from({ length: 66 }, (_, book) => `gtb-notes/${book}.json`)];  // the translation's notes

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.startsWith("gtb-") && k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Network first so updates show up right away; fall back to the cache when offline.
// "no-cache" makes the browser check with the server instead of reusing its own 10-minute copy.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  event.respondWith(
    fetch(event.request.url, { cache: "no-cache" })
      .then((response) => {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
