const SHELL_CACHE = "lyne-pwa-shell-v1";
const COVER_CACHE = "lyne-pwa-covers-v1";
const MAX_COVER_ENTRIES = 350;
const COVER_HOSTS = [
  "yt3.googleusercontent.com",
  "lh3.googleusercontent.com",
  "covers.tryliner.fun",
  "i1.sndcdn.com",
  "i2.sndcdn.com",
  "i3.sndcdn.com",
  "i4.sndcdn.com",
  "img.sndcdn.com",
  "a1.sndcdn.com",
  "i.pinimg.com",
  "images.genius.com",
  "yandex-images.clstorage.net",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.add(new Request(self.registration.scope, { cache: "reload" }));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("lyne-pwa-") && ![SHELL_CACHE, COVER_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCoverRequest(url) {
  try {
    const host = new URL(url).hostname;
    return COVER_HOSTS.some((domain) => host === domain || host.endsWith("." + domain));
  } catch {
    return false;
  }
}

async function trimCoverCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_COVER_ENTRIES) {
    await Promise.all(keys.slice(0, keys.length - MAX_COVER_ENTRIES).map((key) => cache.delete(key)));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin && isCoverRequest(request.url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(COVER_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok && response.type !== "opaque") {
            await cache.put(request, response.clone());
            void trimCoverCache(cache);
          }
          return response;
        } catch (error) {
          const stale = await cache.match(request);
          if (stale) return stale;
          throw error;
        }
      })(),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(self.registration.scope, response.clone());
          }
          return response;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match(self.registration.scope)) || Response.error();
        }
      })(),
    );
    return;
  }

  if (["script", "style", "font", "image"].includes(request.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      })(),
    );
  }
});
