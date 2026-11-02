import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { contentSecurityPolicyPlugin } from "./vite.csp";

const projectRoot = import.meta.dirname;
const mobileRoot = path.resolve(projectRoot, "./mobile");

export default defineConfig({
  root: mobileRoot,
  base: process.env.VITE_MOBILE_BASE || "/mobile/",
  publicDir: path.resolve(mobileRoot, "public"),
  plugins: [react(), tailwindcss(), contentSecurityPolicyPlugin({ allowAuthFrame: true })],
  resolve: {
    alias: {
      "@/features/auth/store/authStore": path.resolve(mobileRoot, "./authStore.ts"),
      "@": path.resolve(projectRoot, "./src"),
      "next/navigation": path.resolve(projectRoot, "./src/lib/navigation.tsx"),
      "next/link": path.resolve(projectRoot, "./src/lib/navigation.tsx"),
      "next/image": path.resolve(projectRoot, "./src/components/ui/AppImage.tsx"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify("0.2.17"),
  },
  server: { port: 5174, strictPort: true },
  build: {
    outDir: path.resolve(projectRoot, "./dist-mobile"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(mobileRoot, "index.html"),
    },
  },
});
