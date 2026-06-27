/**
 * Google Calendar 연동 도메인 타입.
 *
 * 백엔드(Google Calendar 연동)는 GET /todos 응답에 events 를 함께 실어 보내고,
 * 연결/해제/동기화는 /calendar/* 엔드포인트로 제공한다.
 * 이벤트는 **읽기 전용**(체크/완료/수정/삭제 불가).
 */

/** 캘린더 이벤트 (GET /todos 의 data.events 항목, 응답이 이미 camelCase). */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  /** UTC ISO datetime. 종일 이벤트면 null. */
  startAt: string | null;
  /** UTC ISO datetime. 종일 이벤트면 null. */
  endAt: string | null;
  allDay: boolean;
  /** 표시 기준 날짜 (YYYY-MM-DD). 종일 이벤트는 이 값으로 날짜만 표시. */
  dateKey: string;
  /** IANA timezone. 종일 이벤트면 null. startAt 로컬 복원에 사용. */
  timezone: string | null;
  status: string;
  /** Google Calendar 원본 링크. */
  htmlLink: string | null;
  source: "google_calendar";
}

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
  /** GET /todos 로 함께 수신한 읽기 전용 이벤트 목록. */
  events: CalendarEvent[];
}

export const INITIAL_CALENDAR_STATE: CalendarState = {
  status: "unknown",
  googleUserId: null,
  lastSyncedAt: null,
  events: [],
};
