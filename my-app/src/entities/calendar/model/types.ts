/**
 * Google Calendar 연동 도메인 타입.
 * 연결/해제는 /calendar/* 엔드포인트로 제공한다.
 * Google Calendar 이벤트는 이제 Todo로 승격되어 별도 CalendarEvent 타입이 없다.
 */

/**
 * 캘린더 연결 상태.
 *  - "unknown": 아직 확인 전(프로브 미완료)
 *  - "connected": 정상 연결됨
 *  - "needs-reauth": 연결되어 있으나 토큰 무효 → 재연결 유도
 *  - "not-connected": 미연결
 */
export type CalendarStatus =
  | "unknown"
  | "connected"
  | "needs-reauth"
  | "not-connected";

export interface CalendarState {
  status: CalendarStatus;
  /** 연결된 Google 계정 식별자 (GET /calendar/connection). */
  googleUserId: string | null;
  /** 마지막 동기화 시각 (ISO). */
  lastSyncedAt: string | null;
}

export const INITIAL_CALENDAR_STATE: CalendarState = {
  status: "unknown",
  googleUserId: null,
  lastSyncedAt: null,
};
