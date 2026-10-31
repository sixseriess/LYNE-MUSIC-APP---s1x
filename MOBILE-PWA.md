# LYNE Mobile PWA

This branch adds an installable mobile web build while keeping the Windows desktop release on `main`.

## Build locally

From `LYNE-Redesigned-Logo-Fixed`:

```sh
pnpm install
pnpm build:pwa
```

The static site is written to `dist/` and uses the GitHub Pages base path for this repository.

## Install on a phone

- **iPhone/iPad:** open the deployed HTTPS site in Safari, tap Share, then choose **Add to Home Screen**.
- **Android:** open the deployed HTTPS site in Chrome, then choose **Install app** or **Add to Home Screen**.

The app manifest, service worker, app icon, install hint, and mobile navigation are included in this branch.

## Important browser/API limitation

The current LYNE client obtains request signatures from the Electron main process. Its browser fallback deliberately sends API requests without those native HMAC headers, and the Electron desktop process also supplies CORS headers for the API. A static PWA cannot safely contain the desktop signing secret or reproduce that native trust boundary.

The PWA can be installed and its web shell can load, but sign-in, search, and streaming may be rejected by the current API until the backend explicitly supports the deployed browser origin and provides a browser-safe session/signing flow. Do **not** put `LINER_DEV_SIGNING_SECRET` or another signing secret in this frontend or in GitHub Pages.

Desktop-only features such as local file access, Discord Rich Presence, native overlays, and global shortcuts remain unavailable in a browser.
