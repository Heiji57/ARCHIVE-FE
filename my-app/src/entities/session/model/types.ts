/**
 * 활성 세션(로그인된 기기) 도메인 타입.
 * api.yaml SessionResponse 와 동일한 camelCase 형태 (auth 도메인은 snake 매핑 없음).
 */
export interface Session {
  sessionId: string;
  /** User-Agent 파싱 라벨 (예: "Chrome on Windows") */
  deviceLabel: string | null;
  /** User-Agent 원문 */
  deviceInfo: string | null;
  /** IP prefix (통계용) */
  ipPrefix: string | null;
  issuedAt: string;
  lastUsedAt: string;
  /** 이 세션에서 발생한 refresh 횟수 */
  rotationCounter: number;
  /** 이 요청(현재 브라우저)을 보낸 세션 여부 */
  isCurrent: boolean;
}
