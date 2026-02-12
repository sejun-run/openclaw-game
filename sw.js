const CACHE_NAME = 'server-defense-v2';
const urlsToCache = [
  '/openclaw-game/game-v2.html',
  '/openclaw-game/manifest.json'
];

// 설치 시 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 요청 시 캐시 우선
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
