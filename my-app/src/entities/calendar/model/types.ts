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

/**
 * 사용자 캘린더(개인, 팀, 스터디처럼 할 일을 묶는 목록). 서버(api.yaml)에 아직 없다.
 * 데모 모드에서만 쓰고(`useServerFeature("userCalendars")`), 실제 모드에서는 목록과 책갈피를 숨긴다.
 */
export interface UserCalendar {
  id: string;
  name: string;
  /** 팔레트 칸 이름. 색은 토큰 `--cal-<color>` (app/styles/tokens/redesign.css). */
  color: CalendarColor;
  /** 새 할 일이 들어가는 기본 캘린더. 하나만 true. */
  isDefault: boolean;
}

/** 캘린더 색 팔레트(시안 planner.js P.CALC 순서). */
export const CALENDAR_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"] as const;
export type CalendarColor = (typeof CALENDAR_COLORS)[number];
