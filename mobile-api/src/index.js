const UPSTREAM = "https://api.tryliner.fun";
const ALLOWED_ORIGINS = new Set([
  "https://sixseriess.github.io",
]);

const ALLOWED_HEADERS = new Set([
  "authorization",
  "content-type",
  "x-client-version",
  "x-platform",
  "x-request-id",
  "x-user-id",
  "x-user-name",
  "x-session-id",
  "x-liner-signature",
  "x-liner-timestamp",
  "x-liner-nonce",
  "if-none-match",
  "if-modified-since",
  "range",
]);

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": [...ALLOWED_HEADERS].join(", "),
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function addCors(response, origin) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }

  const cookies = response.headers.getSetCookie?.() ?? [];
  if (cookies.length) {
    headers.delete("Set-Cookie");
    for (const cookie of cookies) {
      headers.append("Set-Cookie", cookie.replace(/;\\s*Domain=[^;]+/i, ""));
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin");
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return new Response("Forbidden origin", {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (request.method === "OPTIONS") {
      const requestedHeaders = (request.headers.get("Access-Control-Request-Headers") || "")
        .split(",")
        .map((header) => header.trim().toLowerCase())
        .filter(Boolean);

      const denied = requestedHeaders.filter((header) => !ALLOWED_HEADERS.has(header));
      if (denied.length) {
        return json({ error: "Header not allowed", headers: denied }, 403, origin);
      }

      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "TRACE" || request.method === "CONNECT") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    const incomingUrl = new URL(request.url);
    if (incomingUrl.pathname === "/__proxy_health") {
      return json({ status: "ok", service: "lyne-mobile-proxy" }, 200, origin);
    }

    const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, UPSTREAM);
    const headers = new Headers(request.headers);
    headers.delete("Host");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("x-forwarded-for");

    // The upstream API sees its own trusted origin. Browser CORS remains
    // restricted to the GitHub Pages origin in the response headers above.
    headers.set("Origin", new URL(UPSTREAM).origin);

    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });

    try {
      const upstreamResponse = await fetch(upstreamRequest, {
        cf: { cacheTtl: 0, cacheEverything: false },
      });
      return addCors(upstreamResponse, origin);
    } catch {
      return json({ error: "Upstream API unavailable" }, 502, origin);
    }
  },
};
