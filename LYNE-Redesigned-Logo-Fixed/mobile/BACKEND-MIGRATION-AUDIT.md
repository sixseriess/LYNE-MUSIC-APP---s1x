# LYNE Mobile backend migration audit

Branch: `mobile-pwa`

## Current state

- Mobile sign-in, registration, session restore, profile metadata updates, and sign-out use the Supabase client in `mobile/supabaseAuth.ts`.
- The shared app API in `src/shared/api/api.ts` still sends application requests through `getApiBaseUrl()`.
- The mobile deploy workflow sets `VITE_API_URL` to the Cloudflare Worker at `lyne-mobile-api.nealeadam10.workers.dev`.
- The Worker in `mobile-api/src/index.js` forwards requests to `https://api.tryliner.fun`. It is a CORS proxy, not a replacement backend.
- No Supabase SQL migrations, app tables, or Edge Functions were found in this repository at the time of this audit.

## Shared API surface that still needs a replacement

The routes in `src/shared/api/api.ts` group into these capabilities:

| Capability | Existing route families |
| --- | --- |
| Account and profile | `/v1/me`, `/v1/users/*` |
| Social graph | user search, follow/unfollow, followers, following |
| User library | `/v1/me/library/*` |
| User playlists | `/v1/me/playlists/*` |
| Catalog and discovery | `/v1/catalog/*`, `/v1/explore/*`, track radio |
| Lyrics | `/v1/me/lyrics/*`, `/v1/tracks/*/lyrics` |
| Playback history and recommendations | `/v1/me/history`, `/v1/me/playback/events`, daily mixes |
| Community features | leaderboards and public user history/playlists |

Track/album/artist metadata and playable audio are separate concerns: a Supabase database can store LYNE-owned user data, but it does not itself provide a licensed music catalog or audio stream URLs.

## Safe migration sequence

1. Keep the existing desktop API untouched. Mobile-specific routing must be isolated from desktop builds.
2. Define and provision the Supabase schema for LYNE-owned data first: profiles, privacy settings, follows, saved tracks/albums/artists, playlists, playlist items, playback events/history, and recommendation snapshots. Add row-level security policies before using client access.
3. Decide the catalog and audio provider independently. Supabase is not a drop-in music catalogue or streaming provider. Confirm the source, rights, API contract, rate limits, and playback URL behavior before replacing catalog/playback calls.
4. Implement mobile-only adapters behind the existing app API contracts. Migrate one capability at a time and test on a real mobile browser.
5. Remove the Worker-to-Liner forwarding only after every required mobile route and media URL has a tested replacement. Then add a mobile build check that rejects accidental Liner API destinations.

## Explicit non-goals

- Do not edit Electron/Windows source, installer files, desktop environment configuration, or the `main` branch.
- Do not point the mobile app directly at Supabase for endpoints whose schema or behavior has not been implemented.
- Do not remove the current Worker prematurely: doing so would break shared app features that still depend on its upstream API.
