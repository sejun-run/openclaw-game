const CACHE_NAME = 'server-defense-v6';
const urlsToCache = [
  '/openclaw-game/game.html',
  '/openclaw-game/manifest.json'
];

// 설치 시 캐시 + 즉시 활성화
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // 즉시 활성화
  );
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // 모든 클라이언트에 적용
  );
});

// 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공하면 캐시 업데이트
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
