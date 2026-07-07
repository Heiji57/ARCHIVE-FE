/** 알림 도메인 API. */
import type { NotificationItem } from "@/entities/notification/model/types";
import { request, streamSSE } from "./client";
import { toNotification } from "./mappers";
import type { components } from "./schema";

/** resource==="todo" SSE 이벤트 — DB 미저장 ephemeral. FE todo 상태 갱신 전용. */
export interface CalendarSyncSSEEvent {
  todoId: string;
  calendarLinked: boolean;
  calendarPushStatus: "synced" | "failed" | "pending_delete" | null;
}

type NotificationResponse = components["schemas"]["NotificationResponse"];

export async function apiListNotifications(
  unreadOnly = false,
): Promise<NotificationItem[]> {
  const list = await request<NotificationResponse[]>("/notifications", {
    query: { unreadOnly },
  });
  return list.map(toNotification);
}

export async function apiMarkNotificationRead(id: string): Promise<void> {
  await request(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function apiMarkAllNotificationsRead(): Promise<void> {
  await request("/notifications/read-all", { method: "PATCH" });
}

export async function apiDeleteNotification(id: string): Promise<void> {
  await request(`/notifications/${id}`, { method: "DELETE" });
}

/** readOnly=true 면 읽은 알림만, false 면 전체 삭제. */
export async function apiClearNotifications(readOnly = false): Promise<void> {
  await request("/notifications", { method: "DELETE", query: { readOnly } });
}

/**
 * 실시간 알림 SSE 구독. 새 알림마다 onNotification 호출.
 * 5분 타임아웃 등으로 스트림이 끝나면 onClose 호출(호출자가 재연결).
 * 반환 함수로 구독 중단.
 */
export function streamNotifications(
  onNotification: (n: NotificationItem) => void,
  onClose?: () => void,
  onCalendarSync?: (e: CalendarSyncSSEEvent) => void,
): () => void {
  return streamSSE(
    "/notifications/stream",
    (data) => {
      const payload = data as Record<string, unknown>;
      if (!payload || typeof payload.id !== "string") return;

      // resource==="todo" : ephemeral 이벤트 — 알림 패널에 저장하지 않고 todo 상태만 갱신
      if (payload.resource === "todo" && typeof payload.todo_id === "string") {
        onCalendarSync?.({
          todoId: payload.todo_id,
          calendarLinked: payload.calendar_linked as boolean,
          calendarPushStatus: payload.calendar_push_status as CalendarSyncSSEEvent["calendarPushStatus"],
        });
        return;
      }

      onNotification(toNotification(payload as NotificationResponse));
    },
    onClose,
  );
}
