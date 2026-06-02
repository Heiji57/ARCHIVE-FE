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
  /** 선택적 액션 버튼 (예: 데모에서 "로그인" 유도). href 로 이동. */
  actionLabel?: string;
  actionHref?: string;
}
