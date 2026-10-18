// Kablamagram service worker: makes the game installable and playable offline.
// Network first, so a newly pushed version shows up straight away; the cached copy
// is only used when there's no connection.
const CACHE = 'kablamagram-v1';
// what offline play needs (the big 512px icons are only fetched when installing)
const FILES = ['./', './manifest.webmanifest', './fonts/bangers-latin.woff2', './icons/icon-192.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const key = url.origin + url.pathname; // one cached copy per file, whatever ?query it was loaded with
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key)
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('./') : null))
      .then(res => res || Response.error()))
  );
});
