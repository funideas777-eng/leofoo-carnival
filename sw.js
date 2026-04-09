const CACHE_NAME = 'leofoo-carnival-v3';
const STATIC_ASSETS = [
  '/leofoo-carnival/index.html',
  '/leofoo-carnival/map.html',
  '/leofoo-carnival/game.html',
  '/leofoo-carnival/adventure.html',
  '/leofoo-carnival/scoreboard.html',
  '/leofoo-carnival/admin.html',
  '/leofoo-carnival/css/common.css',
  '/leofoo-carnival/js/config.js',
  '/leofoo-carnival/js/auth.js',
  '/leofoo-carnival/js/api.js',
  '/leofoo-carnival/js/audio.js',
  '/leofoo-carnival/js/gps.js',
  '/leofoo-carnival/js/broadcast.js',
  '/leofoo-carnival/js/map-engine.js',
  '/leofoo-carnival/js/scoreboard-engine.js',
  '/leofoo-carnival/js/photo.js',
  '/leofoo-carnival/js/chat.js',
  '/leofoo-carnival/js/games/snake.js',
  '/leofoo-carnival/js/games/racing.js',
  '/leofoo-carnival/js/games/memory.js',
  '/leofoo-carnival/js/games/rhythm.js',
  '/leofoo-carnival/js/games/whack.js',
  '/leofoo-carnival/js/games/puzzle.js',
  '/leofoo-carnival/js/games/catch.js',
  '/leofoo-carnival/js/games/quiz.js',
  '/leofoo-carnival/js/games/runner.js',
  '/leofoo-carnival/js/games/bubble.js',
  '/leofoo-carnival/assets/icons/icon-192.png',
  '/leofoo-carnival/assets/icons/icon-512.png',
  '/leofoo-carnival/manifest.json'
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API requests (GAS) → network only, no cache
  if (url.hostname === 'script.google.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets → cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
