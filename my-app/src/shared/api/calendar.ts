/**
 * Google Calendar 연동 API.
 *
 * - GET    /calendar/connection      연결 상태 조회
 * - POST   /calendar/connect/init    연결 시작 (authorizeUrl 발급 → 팝업)
 * - DELETE /calendar/connection      연결 + 이벤트 전체 삭제
 *
 * 연결 플로우는 GitHub 계정 연결(apiLinkOAuth)과 동일한 팝업 + postMessage 패턴.
 * 콜백(/calendar/callback)은 `{ type: "calendar_connected" }` / `{ type: "calendar_error", error }`.
 *
 * 위 3개는 v2 로 호출한다(본문 동일, 에러코드만 세분화:
 * GOOGLE_CALENDAR_RATE_LIMITED / GOOGLE_CALENDAR_RESPONSE_INVALID).
 * 콜백은 Google 에 등록된 redirect URI 라 v1(/api/v1/calendar/callback) 그대로이며,
 * authorizeUrl 의 redirect_uri 는 서버가 채우므로 FE 는 콜백 경로를 다루지 않는다.
 * 콜백 postMessage 는 origin(window.location.origin)만 검사하므로 버전과 무관하다.
 */
import { request } from "./client";
import { API_V2_BASE_URL } from "./config";
import { isApiError } from "./errors";
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
  const res = await request<CalendarConnectionResponse>("/calendar/connection", {
    baseUrl: API_V2_BASE_URL,
  });
  return {
    connected: res?.connected ?? false,
    needsReauth: res?.needsReauth ?? false,
    googleUserId: res?.googleUserId ?? null,
    lastSyncedAt: res?.lastSyncedAt ?? null,
  };
}

/** 캘린더 연결 해제 (DELETE /calendar/connection) — 연결 + 이벤트 전체 삭제. */
export async function apiDisconnectCalendar(): Promise<void> {
  await request("/calendar/connection", {
    method: "DELETE",
    baseUrl: API_V2_BASE_URL,
  });
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
      { method: "POST", baseUrl: API_V2_BASE_URL },
    );
    authorizeUrl = init.authorizeUrl;
  } catch (e) {
    // 에러코드(GOOGLE_CALENDAR_RATE_LIMITED 등)를 그대로 넘겨 호출측이 안내를 고르게 한다.
    return { ok: false, error: isApiError(e) ? e.code : "init-failed" };
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

