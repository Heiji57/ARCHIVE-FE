import type { Todo } from "@/entities/todo/model/types";
import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";

export interface DueBandDay {
  /** 날짜. 지난 마감 묶음은 null. */
  dateKey: string | null;
  overdue: boolean;
  todos: Todo[];
}

const DAY_MS = 864e5;
const diff = (a: string, b: string) => Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / DAY_MS);

/** 마감이 있고 끝내지 않은 일(마감 순). */
const open = (todos: Todo[]) =>
  todos.filter((t) => t.dueDate && t.status !== "done").sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

/**
 * 마감 탭 일주일 띠(시안 rpanel.js 마감 2번): 지난 마감 묶음(있을 때만)이 앞, 그 뒤로 오늘부터 7일.
 * 실제 모드는 불러온 범위(state.todos) 안에서만 계산한다. 서버에 지난 마감 조회가 생기면
 * (`useServerFeature("overdueQuery")`) 지난 마감 묶음은 그 결과로 바꾼다.
 */
export function dueBand(todos: Todo[], today: string): DueBandDay[] {
  const list = open(todos);
  const late = list.filter((t) => t.dueDate! < today);
  const days = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(fromDateKey(today), i)));
  return [
    ...(late.length ? [{ dateKey: null, overdue: true, todos: late }] : []),
    ...days.map((d) => ({ dateKey: d, overdue: false, todos: list.filter((t) => t.dueDate === d) })),
  ];
}

/** 마감 탭 숫자: 지난 마감 + 7일 안 마감. */
export function dueCount(todos: Todo[], today: string): number {
  return dueBand(todos, today).reduce((n, d) => n + d.todos.length, 0);
}

/** D 표시(D+1 지남, D-day, D-1). 지나면 late, 오늘과 내일은 soon. */
export function dueTag(dueDate: string, today: string): { label: string; tone: "" | "soon" | "late" } {
  const n = diff(today, dueDate);
  if (n < 0) return { label: `D+${-n}`, tone: "late" };
  if (n === 0) return { label: "D-day", tone: "soon" };
  return { label: `D-${n}`, tone: n <= 1 ? "soon" : "" };
}

/** 마감 하루 미루기. */
export const nextDay = (dateKey: string) => toDateKey(addDays(fromDateKey(dateKey), 1));
