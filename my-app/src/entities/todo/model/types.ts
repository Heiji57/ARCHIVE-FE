export type TaskStatus = "done" | "in-progress" | "not-start";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dateKey: string;
  createdAt: string;
  completedAt?: string | null;
  status: TaskStatus;
  description: string;
  /**
   * 선택적 시작/종료 시각 ("HH:mm", 24시간제). 일간 타임라인 뷰의 블록 배치에 사용.
   * 비어 있으면(오늘 한정) createdAt 시각 기준 1시간 블록으로 자동 배치된다.
   * NOTE: api.yaml 의 Todo 스키마에는 시간 필드가 없다(계약 간극, CLAUDE.md §8 참고).
   *   → 현재 FE 로컬 상태로만 유지되며, 영속화하려면 백엔드에 start_time/end_time 추가 필요.
   */
  startTime?: string | null;
  endTime?: string | null;
  /** Google Calendar 연동 여부 (push 완료/대기/진행 중 포함). */
  calendarLinked: boolean;
  /** 연동 세부 상태. null = 미연동. */
  calendarPushStatus: "pending" | "syncing" | "synced" | "failed" | "pending_delete" | null;
}
