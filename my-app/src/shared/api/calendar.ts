/**
 * Google Calendar 연동 API.
 *
 * - GET    /calendar/connection      연결 상태 조회
 * - POST   /calendar/connect/init    연결 시작 (authorizeUrl 발급 → 팝업)
 * - POST   /calendar/sync            수동 강제 동기화 후 연결 상태 반환
 * - DELETE /calendar/connection      연결 + 이벤트 전체 삭제
 *
 * 연결 플로우는 GitHub 계정 연결(apiLinkOAuth)과 동일한 팝업 + postMessage 패턴.
 * 콜백(/calendar/callback)은 `{ type: "calendar_connected" }` / `{ type: "calendar_error", error }`.
 */
import type { CalendarEvent } from "@/entities/calendar/model/types";
import { request } from "./client";
import type { components } from "./schema";

// 서버 응답은 이미 camelCase → 매핑 없이 그대로 사용한다.
type CalendarConnectionResponse =
  components["schemas"]["CalendarConnectionResponse"];
type CalendarConnectInitResponse =
  components["schemas"]["CalendarConnectInitResponse"];

export interface CalendarConnection {
  connected: boolean;
  needsReauth: boolean;
  googleUserId: string | null;
  lastSyncedAt: string | null;
}

interface CalendarPopupMessage {
  type: "calendar_connected" | "calendar_error";
  error?: string;
}

// ── Connection ───────────────────────────────────────────────────────────────

/** 캘린더 연결 상태 조회 (GET /calendar/connection). */
export async function apiGetCalendarConnection(): Promise<CalendarConnection> {
  const res = await request<CalendarConnectionResponse>("/calendar/connection");
  return {
    connected: res?.connected ?? false,
    needsReauth: res?.needsReauth ?? false,
    googleUserId: res?.googleUserId ?? null,
    lastSyncedAt: res?.lastSyncedAt ?? null,
  };
}

/** 캘린더 연결 해제 (DELETE /calendar/connection) — 연결 + 이벤트 전체 삭제. */
export async function apiDisconnectCalendar(): Promise<void> {
  await request("/calendar/connection", { method: "DELETE" });
}

/**
 * 수동 강제 동기화 (POST /calendar/sync?from=&to=) → 해당 범위 이벤트 목록 반환.
 *
 * Breaking change: 이전에는 연결 상태({ connected, ... })를 반환했으나,
 * 이제 CalendarEvent[] 를 반환한다. 연결 상태 갱신은 별도 GET /calendar/connection.
 * 최대 범위 62일. 초과 시 422.
 */
export async function apiSyncCalendar(
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const list = await request<CalendarEvent[] | null | undefined>(
    "/calendar/sync",
    { method: "POST", query: { from, to } },
  );
  return Array.isArray(list) ? list : [];
}

/**
 * 캘린더 연결 시작 (POST init → 팝업 → postMessage).
 *
 * 1. POST /calendar/connect/init (Bearer) → { authorizeUrl }
 * 2. authorizeUrl 을 팝업으로 연다 (Google 동의 화면).
 * 3. 동의 완료 시 팝업이 window.opener.postMessage 로 결과 통지:
 *    - 성공: { type: "calendar_connected" }
 *    - 실패: { type: "calendar_error", error }
 *    (보안: frontend origin 에서 온 메시지만 신뢰)
 */
export async function apiConnectCalendar(): Promise<{
  ok: boolean;
  error?: string;
}> {
  let authorizeUrl: string;
  try {
    const init = await request<CalendarConnectInitResponse>(
      "/calendar/connect/init",
      { method: "POST" },
    );
    authorizeUrl = init.authorizeUrl;
  } catch {
    return { ok: false, error: "init-failed" };
  }

  return new Promise((resolve) => {
    const popup = window.open(
      authorizeUrl,
      "calendar-connect",
      "width=600,height=700",
    );
    if (!popup) {
      resolve({ ok: false, error: "popup-blocked" });
      return;
    }

    let settled = false;
    const finish = (result: { ok: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(closedTimer);
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as CalendarPopupMessage | undefined;
      const looksCalendar =
        !!data &&
        typeof data === "object" &&
        (data.type === "calendar_connected" ||
          data.type === "calendar_error");
      // 보안: 같은 origin(프록시)에서 온 메시지만 신뢰.
      if (event.origin !== window.location.origin) {
        if (looksCalendar) {
          console.warn(
            `[calendar] 예상치 못한 origin(${event.origin})에서 메시지 수신해 무시함. ` +
              `기대 origin=${window.location.origin}.`,
            data,
          );
        }
        return;
      }
      if (!looksCalendar) return;
      if (data.type === "calendar_connected") {
        finish({ ok: true });
      } else {
        finish({ ok: false, error: data.error ?? "calendar-failed" });
      }
    };

    window.addEventListener("message", onMessage);
    const closedTimer = window.setInterval(() => {
      if (popup.closed) finish({ ok: false, error: "popup-closed" });
    }, 500);
  });
}

// ── Events (선택: 캘린더 전용 화면용. todo 화면은 GET /todos 로 충분) ───────────

/** 기간 범위의 이벤트만 조회 (GET /calendar/events). */
export async function apiListCalendarEvents(
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const list = await request<CalendarEvent[] | null | undefined>(
    "/calendar/events",
    { query: { from, to } },
  );
  return Array.isArray(list) ? list : [];
}
