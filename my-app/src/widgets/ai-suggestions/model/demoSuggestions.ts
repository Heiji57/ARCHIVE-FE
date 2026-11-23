/** 데모 고정 추천 목록 (be-request 11 §2 모양). */
export interface AiSuggestion {
  id: string;
  kind: "overdue" | "free_slot" | "commit_match";
  todoId: string | null;
  title: string;
  reason: string;
  dateKey: string;
  startTime: string | null;
  endTime: string | null;
  actions: Array<{ code: string; label: string; patch: Partial<{ dateKey: string; startTime: string; endTime: string }> }>;
}

export const DEMO_SUGGESTIONS: readonly AiSuggestion[] = [
  {
    id: "sug-1",
    kind: "overdue",
    todoId: "demo-todo-3",
    title: "디자인 리뷰 피드백 반영",
    reason: "마감이 3일 지났어요.",
    dateKey: "2026-11-19",
    startTime: null,
    endTime: null,
    actions: [
      { code: "move_today", label: "오늘로 넣기", patch: { dateKey: "2026-11-19" } },
      { code: "move_tomorrow", label: "내일로 넘기기", patch: { dateKey: "2026-11-20" } },
    ],
  },
  {
    id: "sug-2",
    kind: "free_slot",
    todoId: null,
    title: "오후 2시~3시 비어 있어요",
    reason: "일정 없이 비어 있어요. 할 일 하나 넣을까요?",
    dateKey: "2026-11-19",
    startTime: "14:00",
    endTime: "15:00",
    actions: [{ code: "add_sprint_meeting", label: "스프린트 회의 추가", patch: { dateKey: "2026-11-19", startTime: "14:00", endTime: "15:00" } }],
  },
  {
    id: "sug-3",
    kind: "commit_match",
    todoId: "demo-todo-7",
    title: "API 연동 테스트",
    reason: "오늘 커밋 'fix: api timeout'과 연관 있어요.",
    dateKey: "2026-11-19",
    startTime: null,
    endTime: null,
    actions: [{ code: "mark_done", label: "끝낸 것으로", patch: {} }],
  },
];
