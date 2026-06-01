/** 알림 도메인 API. */
import type { NotificationItem } from "@/entities/notification/model/types";
import { request, streamSSE } from "./client";
import { toNotification } from "./mappers";
import type { components } from "./schema";

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
): () => void {
  return streamSSE(
    "/notifications/stream",
    (data) => {
      // {type:"timeout"} 같은 제어 이벤트는 id 가 없으므로 건너뛴다.
      const payload = data as Partial<NotificationResponse>;
      if (!payload || typeof payload.id !== "string") return;
      onNotification(toNotification(payload as NotificationResponse));
    },
    onClose,
  );
}
