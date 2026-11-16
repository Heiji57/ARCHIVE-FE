/** URL `?demo=true` 여부. 게스트 데모 모드 판별 (SSR 안전). */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("demo") === "true"
}
