/** 알림 도메인 API. */
import type { NotificationItem } from "@/entities/notification/model/types";
import { request } from "./client";
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
