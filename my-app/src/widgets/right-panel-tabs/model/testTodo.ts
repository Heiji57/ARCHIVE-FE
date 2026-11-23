import type { Todo } from "@/entities/todo/model/types";

/** 테스트용 할 일(기본: 2026-11-03, 진행 전, 시간 없음). */
export const todo = (p: Partial<Todo> & { id: string }): Todo => ({
  title: p.id,
  completed: false,
  dateKey: "2026-11-03",
  createdAt: "",
  status: "not-start",
  description: "",
  startTime: null,
  endTime: null,
  calendarLinked: false,
  calendarPushStatus: null,
  isVirtual: false,
  seriesId: null,
  originalDateKey: null,
  recurrenceRule: null,
  tags: [],
  dueDate: null,
  ...p,
});
