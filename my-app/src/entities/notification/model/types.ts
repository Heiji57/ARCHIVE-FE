export type NoticeType = "success" | "info" | "warning";

export interface NotificationItem {
  id: string;
  type: NoticeType;
  title: string;
  message: string;
  timestamp: string;
}
