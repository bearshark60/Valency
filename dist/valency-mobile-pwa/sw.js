// VALENCY Mobile PWA Service Worker — Offline-ready core cache (excludes huge WAVs so iPhone loads fast!)
const CACHE_NAME = 'valency-mobile-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './mobile.html',
  './manifest.webmanifest',
  './src/styles/main.css',
  './src/styles/mobile.css',
  './src/data/cards.js',
  './src/data/compounds.js',
  './src/engine/gameEngine.js',
  './src/story/scientists.js',
  './src/story/scientistCardSchema.js',
  './src/story/opponentConfigs.js',
  './src/story/evaluation.js',
  './src/story/researchChallenges.js',
  './src/story/progression.js',
  './src/story/academyChapter.js',
  './src/engine/ai.js',
  './src/ui/sound.js',
  './src/ui/animations.js',
  './src/ui/tutorial.js',
  './src/ui/storyUI.js',
  './src/ui/app.js',
  './src/ui/mobileShell.js',
  './assets/icons/valency-icon-180.png',
  './assets/icons/valency-icon-192.png',
  './assets/icons/valency-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Let large audio files stream directly from network rather than bloating iOS cache quota
  if (req.url.includes('/assets/audio/')) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
