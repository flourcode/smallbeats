/* Small Beats · service worker. Keeps a copy of the site so it opens offline and installs as an app. Every sound is made
   on the device, so the whole machine works offline. Requests to other sites (only Google Analytics) go straight to the network.
   Updates need no version bump: every request goes to the network first (revalidating, not trusting the HTTP cache), so
   anyone online gets exactly what's deployed, and the offline copy refreshes as they go. The cache is only used offline. */
const CACHE = 'smallbeats-v47';
const SHELL = ['./', './index.html', './privacy.html', './terms.html', './404.html', './app.css', './app.js', './engine.js', './composer.js', './buddies.js', './qr.js', './analytics.js',
  './fonts/silkscreen-400.woff2', './fonts/barlow-condensed-600.woff2', './fonts/barlow-condensed-700.woff2', './fonts/doto-900.woff2', './fonts/plex-400.woff2', './fonts/plex-600.woff2', './manifest.webmanifest', './favicon.ico',
  './icons/logo-2.png', './icons/logo-3.png', './icons/logo-4.png', './icons/logo-6.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/favicon-32.png', './icons/apple-touch-icon.png', './icons/mark-3.png', './icons/mark-6.png', './icons/stamp-1.png', './icons/stamp-2.png', './icons/stamp-4.png', './how-it-works/'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Network first, so a new version shows up as soon as you're online; cache as the fallback.
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((res) => {
    if (!res.ok) return res;
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
