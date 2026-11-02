# LYNE Mobile API proxy

This Worker gives the LYNE PWA its own browser-facing API origin while forwarding requests to the existing account/API service at `https://api.tryliner.fun`.

It does **not** create a new account database or replace the existing account system. It is a same-account proxy intended to solve browser CORS/preflight restrictions for the GitHub Pages PWA.

## Security and scope

- Only accepts the production PWA origin `https://sixseriess.github.io`.
- Proxies requests to one fixed upstream host; it is not an open proxy.
- Handles browser OPTIONS preflight without sending OPTIONS to the upstream API.
- Forwards auth, proof-of-work, Turnstile, bearer-token, and request metadata headers.
- Forwards upstream cookies and removes an upstream Domain attribute so cookies are scoped to the Worker hostname.
- Does not log request bodies, passwords, tokens, or cookies.
- Does not alter the Windows desktop API configuration.

## Deploy

1. Sign in to Cloudflare.
2. Open **Workers & Pages** and create a Worker named `lyne-mobile-api`.
3. Use **Edit code** and replace the starter code with the contents of `src/index.js`.
4. Deploy. Cloudflare will assign a URL similar to `https://lyne-mobile-api.<your-account-subdomain>.workers.dev`.
5. Test that URL with `/__proxy_health`; it should return JSON with `"service":"lyne-mobile-proxy"`. A direct browser visit may return 403 because the proxy intentionally requires the LYNE Pages Origin header; test from the PWA origin or use a CORS-aware request.
6. Configure the mobile PWA build's `VITE_API_URL` to the assigned Worker URL. Do not set this variable in the Windows build.

## Important compatibility check

This is a proxy, not a guarantee that the upstream provider accepts every request from Cloudflare Worker egress. After deployment, test the login challenge and sign-in from an actual phone. If the upstream API enforces additional origin, cookie, or edge-attestation rules, those must be supported by the upstream provider; this Worker must not forge trusted provider credentials or bypass account protections.
