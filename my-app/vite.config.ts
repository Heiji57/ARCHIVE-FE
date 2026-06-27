import { copyFileSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

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

// 백엔드 주소 (dev 전용). VITE_API_PROXY_TARGET 로 override 가능.
const API_PROXY_TARGET =
  process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflareSpaFallback()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // TypeScript 소스 파일(.ts/.tsx)을 컴파일된 .js 파일보다 우선 탐색한다.
    // src/ 에 이전 tsc 실행으로 생성된 .js 파일이 남아 있어도 올바른 소스가 로드된다.
    extensions: [".mts", ".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"],
  },
  server: {
    // 백엔드 OAuth 콜백이 window.opener.postMessage 의 targetOrigin 을
    // http://localhost:3000 으로 고정하고 있어, FE 도 같은 origin(:3000)에서
    // 떠야 OAuth 연결 완료 메시지가 부모 창에 전달된다. (origin 불일치 시 차단)
    port: 3000,
    strictPort: true,
    // HttpOnly refresh 쿠키를 same-origin 으로 다루기 위해 /api 를 백엔드로 프록시.
    // 프론트는 항상 "/api/v1/..." 상대경로로 호출 → CORS 회피 + 쿠키 자동 전송.
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          // 백엔드로 가는 요청에서 Accept-Encoding 을 제거한다.
          // Accept-Encoding 이 있으면 백엔드가 gzip 으로 응답할 수 있고,
          // gzip 은 블록 단위로 디코딩되므로 SSE 청크가 스트림 종료까지 버퍼링된다.
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("Accept-Encoding");
          });
        },
      },
    },
  },
});
