# LYNE Mobile

LYNE Mobile is a separately built, installable Progressive Web App. It reuses the desktop app's React routes, authentication, catalog, library, and player engine while applying a touch-first phone layout.

## Build

From this directory:

```bash
pnpm install --frozen-lockfile
pnpm mobile:dev
pnpm mobile:build
```

The mobile build is written to `dist-mobile/`. It does not change the Electron desktop build output or Windows installer configuration.

## Hosting and installation

Deploy the contents of `dist-mobile/` to an HTTPS static host. Keep the app under the same path used by the build base (default: `/mobile/`). A custom deployment path can be set with `VITE_MOBILE_BASE` when building.

- **iPhone/iPad:** open the HTTPS link in Safari, tap Share, choose Add to Home Screen, then tap Add.
- **Android:** open the HTTPS link in Chrome and choose Install app (or Add to Home screen).

The web app manifest, app icon, service worker, standalone display mode, and install instructions are included. Music and account API calls remain online; the service worker only caches the mobile app shell and same-origin static assets.

## Browser limitations

Mobile browsers control background playback, lock-screen controls, and autoplay policies. Playback must be started by a user gesture. Device-specific testing is required before calling the mobile release production-ready.
