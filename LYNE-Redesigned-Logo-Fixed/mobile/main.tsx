import React from "react";
import ReactDOM from "react-dom/client";
import MobileApp from "./MobileApp";

// The mobile site does not need offline caching yet. Remove the old PWA
// service worker and its shell cache so stale HTML/JS cannot blank the app.
async function clearLegacyMobileWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const mobileRegistrations = registrations.filter((registration) =>
      registration.scope.includes("/LYNE-MUSIC-APP---s1x/mobile/"),
    );
    const hadController = Boolean(navigator.serviceWorker.controller);

    await Promise.all(mobileRegistrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("lyne-mobile-shell-"))
          .map((key) => caches.delete(key)),
      );
    }

    // Reload once so this tab is no longer controlled by the old worker.
    if (hadController && sessionStorage.getItem("lyne-mobile-worker-cleared") !== "1") {
      sessionStorage.setItem("lyne-mobile-worker-cleared", "1");
      window.location.reload();
      return;
    }
    sessionStorage.removeItem("lyne-mobile-worker-cleared");
  } catch (error) {
    console.warn("[LYNE Mobile] legacy service worker cleanup failed", error);
  }
}

void clearLegacyMobileWorker();

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MobileApp />
    </React.StrictMode>,
  );
}
