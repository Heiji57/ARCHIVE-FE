import { copyFileSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * Cloudflare Pages SPA fallback:
 * 파일을 찾지 못하면 404.html 을 서빙하므로,
 * index.html 을 404.html 로 복사해 모든 클라이언트 라우트가 앱을 로드하게 합니다.
 */
function cloudflareSpaFallback(): Plugin {
  return {
    name: "cloudflare-spa-fallback",
    closeBundle() {
      copyFileSync("dist/index.html", "dist/404.html");
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflareSpaFallback(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});