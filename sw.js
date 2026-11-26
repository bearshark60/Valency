// VALENCY Mobile PWA Service Worker — Offline-ready core cache (excludes huge WAVs so iPhone loads fast!)
const CACHE_NAME = 'valency-mobile-v11';
const CORE_ASSETS = [
  './mobile.html',
  './manifest.webmanifest',
  './src/styles/theme-tokens.css',
  './src/styles/main.css',
  './src/styles/character-portrait.css',
  './src/styles/molecular-formation.css',
  './src/styles/mobile.css',
  './src/presentation/visualTheme.js',
  './src/presentation/audioConfig.js',
  './src/presentation/characterSvgRegistry.js',
  './src/presentation/characterRigEngine.js',
  './src/presentation/characterRegistry.js',
  './src/presentation/formationChoreography.js',
  './src/presentation/battleFormationBridge.js',
  './assets/characters/sci_lav_001_frontier/master_layered.svg',
  './assets/characters/sci_lav_001_institute/master_layered.svg',
  './assets/characters/sci_men_002_frontier/master_layered.svg',
  './assets/characters/sci_men_002_institute/master_layered.svg',
  './src/data/cards.js',
  './src/data/compounds.js',
  './src/data/chemicalIdentity.js',
  './src/engine/gameEngine.js',
  './src/story/scientists.js',
  './src/story/scientistCardSchema.js',
  './src/story/opponentConfigs.js',
  './src/story/evaluation.js',
  './src/story/researchChallenges.js',
  './src/story/progression.js',
  './src/story/academyChapter.js',
  './src/frontier/playerProfile.js',
  './src/frontier/collectionManager.js',
  './src/frontier/scientistEquipment.js',
  './src/frontier/worldManager.js',
  './src/frontier/rewardProcessor.js',
  './src/frontier/expeditionManager.js',
  './src/frontier/investigationManager.js',
  './src/frontier/encounterManager.js',
  './src/engine/ai.js',
  './src/ui/sound.js',
  './src/ui/animations.js',
  './src/ui/tutorial.js',
  './src/ui/storyUI.js',
  './src/ui/frontierUI.js',
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
  // Network-first with offline cache fallback so updates always load immediately when online
  // while still working 100% offline on iPhone PWA.
  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
