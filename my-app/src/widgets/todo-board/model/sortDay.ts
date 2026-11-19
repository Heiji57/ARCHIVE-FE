import type { Todo } from "@/entities/todo/model/types";

/** "HH:mm" → 분. */
export function minutes(v: string | null | undefined): number | null {
  const m = v ? /^(\d{1,2}):(\d{2})$/.exec(v) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

const isPeriod = (t: Todo) => !!t.dueDate && t.dueDate > t.dateKey;

/**
 * 하루 열의 순서(시안 planner.js sortDay): 기간 할 일이 위(마감이 늦은 것부터), 나머지는 시작 시각 순,
 * 시간 미정은 아래.
 */
export function sortDay(list: Todo[]): Todo[] {
  return [...list].sort((a, b) => {
    const ma = isPeriod(a);
    const mb = isPeriod(b);
    if (ma !== mb) return ma ? -1 : 1;
    if (ma) return b.dueDate!.localeCompare(a.dueDate!) || a.dateKey.localeCompare(b.dateKey);
    return (minutes(a.startTime) ?? 1e4) - (minutes(b.startTime) ?? 1e4);
  });
}

/** 그 날 열에 놓일 할 일: 시작일이 그 날이거나, 기간 할 일이 그 날에 걸침. */
export function onColumn(t: Todo, dateKey: string): boolean {
  return t.dateKey === dateKey || (isPeriod(t) && t.dateKey <= dateKey && dateKey <= t.dueDate!);
}
