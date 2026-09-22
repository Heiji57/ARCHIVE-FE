/**
 * API 연동 설정.
 *  - USE_API: true 면 실제 백엔드 호출, false(기본) 면 기존 mock 사용.
 *  - API_BASE_URL: 기본값 "/api/v1" — Vite dev proxy(server.proxy)를 통해 백엔드로 전달된다.
 *    (same-origin 이라 HttpOnly refresh 쿠키가 자연스럽게 동작하고 CORS 를 피한다)
 *  - API_V2_BASE_URL: auth v2 엔드포인트(세분화된 에러코드) 전용 base. 기본값은 API_BASE_URL 의
 *    끝 "/v1" 을 "/v2" 로 바꾼 값이라 같은 프록시/호스트로 라우팅된다. VITE_API_V2_BASE_URL 로 override.
 */
export const USE_API = import.meta.env.VITE_USE_API === "true";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

export const API_V2_BASE_URL =
  (import.meta.env.VITE_API_V2_BASE_URL as string | undefined) ??
  API_BASE_URL.replace(/\/v1\/?$/, "/v2");
