// LYNE Mobile no longer uses offline caching. This file replaces and
// unregisters older service-worker versions that could serve stale app files.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("lyne-mobile-shell-"))
            .map((key) => caches.delete(key)),
        ),
      ),
      self.registration.unregister(),
    ]).then(() => self.clients.claim()),
  );
});
