import type { Plugin } from "vite";

function contentSecurityPolicy(isDev: boolean, allowAuthFrame = false): string {
  const scriptSources = [
    "'self'",
    "'unsafe-eval'",
    "'wasm-unsafe-eval'",
    ...(isDev ? ["'unsafe-inline'"] : []),
  ];
  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' * http: https: data: blob: liner-local:",
    "media-src 'self' * http: https: data: blob: liner-local:",
    "connect-src 'self' * http: https: ws: wss: data: blob:",
    ...(allowAuthFrame ? ["frame-src 'self' https://api.tryliner.fun"] : []),
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; ");
}

export function contentSecurityPolicyPlugin(
  options: { allowAuthFrame?: boolean } = {},
): Plugin {
  let isDev = false;
  return {
    name: "liner-content-security-policy",
    configResolved(config) {
      isDev = config.command === "serve";
    },
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content: contentSecurityPolicy(isDev, options.allowAuthFrame === true),
          },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}
