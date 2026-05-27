export type NoticeType = "success" | "info" | "warning";
export type NoticeCategory = "general" | "summary" | "sync" | "system";

export interface NotificationItem {
  id: string;
  type: NoticeType;
  category: NoticeCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
