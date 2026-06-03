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
  /** true 면 토스트로만 잠깐 보이고 알림 센터(패널·배지)에는 표시하지 않는다.
   *  네트워크 오류 같은 일시적 피드백에 사용. */
  transient?: boolean;
}
