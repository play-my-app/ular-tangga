const CACHE_NAME = "boardgame-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/game.js",
  "/manifest.json",
  "/board.png",
  "/car1.png",
  "/car2.png",
  "/dice1.png",
  "/dice2.png",
  "/dice3.png",
  "/dice4.png",
  "/dice5.png",
  "/dice6.png",
  "/bg-music.wav",
  "/icon-512.png"
];

// Install service worker
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// Fetch
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
