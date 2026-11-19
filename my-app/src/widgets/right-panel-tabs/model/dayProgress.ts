import type { Todo } from "@/entities/todo/model/types";

/** "HH:mm" → 분. */
export function minOf(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** 마감일이 시작과 다른 날인 기간 할 일(하루 진행, 시간 미정, 하루 닫기에서 뺀다). */
export const isPeriod = (t: Todo) => !!t.dueDate && t.dueDate > t.dateKey;

/** 시간 칸에 놓이는 할 일의 시작·끝(분). 끝이 없거나 앞이면 시작 + 1시간. */
export function spanOf(t: Todo): { start: number; end: number } | null {
  if (isPeriod(t)) return null;
  const s = minOf(t.startTime);
  if (s === null) return null;
  const e = minOf(t.endTime);
  return { start: s, end: e !== null && e > s ? e : s + 60 };
}

export interface DayProgress {
  /** 지금 시간 칸에 걸친 끝내지 않은 일. */
  current: Todo | null;
  /** 지금 뒤에 시작하는 첫 일(오늘이 아니면 첫 시간 있는 일). */
  next: Todo | null;
  /** 다음 일까지 남은 분(오늘일 때만). */
  nextInMin: number | null;
  /** 지금, 다음을 뺀 남은 일(시간 순, 시간 미정은 뒤). */
  rest: Todo[];
  done: number;
  total: number;
}

/**
 * 오른쪽 패널 하루 탭(시안 rpanel.js 하루 2번 "지금과 다음"). dayTodos 는 그날 할 일,
 * nowMin 은 오늘이면 지금 시각(분), 다른 날이면 null. 기간 할 일은 세지 않는다.
 */
export function dayProgress(dayTodos: Todo[], nowMin: number | null): DayProgress {
  const list = dayTodos.filter((t) => !isPeriod(t));
  const left = list
    .filter((t) => t.status !== "done")
    .map((t) => ({ t, s: spanOf(t) }))
    .sort((a, b) => (a.s?.start ?? 1e9) - (b.s?.start ?? 1e9));
  const current =
    nowMin === null ? null : (left.find((x) => x.s && x.s.start <= nowMin && nowMin < x.s.end)?.t ?? null);
  const nx = left.find((x) => x.s && x.t !== current && (nowMin === null || x.s.start >= nowMin));
  const next = nx?.t ?? null;
  return {
    current,
    next,
    nextInMin: nx?.s && nowMin !== null ? nx.s.start - nowMin : null,
    rest: left.filter((x) => x.t !== current && x.t !== next).map((x) => x.t),
    done: list.filter((t) => t.status === "done").length,
    total: list.length,
  };
}

/** 그날의 끝내지 않은 시간 미정 할 일(기간 할 일 제외). */
export function untimedOn(todos: Todo[], dateKey: string): Todo[] {
  return todos.filter((t) => t.dateKey === dateKey && t.status !== "done" && !isPeriod(t) && minOf(t.startTime) === null);
}

const DAY_FROM = 9 * 60;
const DAY_TO = 19 * 60;

/**
 * 시간 미정 할 일을 넣을 빈 시간(시안 rpanel.js free): 오전 9시(오늘이면 지금 뒤 30분 단위)부터
 * 저녁 7시까지 durMin 이 비는 첫 시각(분). 없으면 null. dayTodos 는 그날 할 일.
 */
export function freeSlot(dayTodos: Todo[], nowMin: number | null, durMin = 60): number | null {
  const busy = dayTodos.map(spanOf).filter((s): s is { start: number; end: number } => s !== null);
  const from = Math.max(DAY_FROM, nowMin === null ? DAY_FROM : Math.ceil(nowMin / 30) * 30);
  for (let h = from; h + durMin <= DAY_TO; h += 30) {
    if (!busy.some((b) => h < b.end && h + durMin > b.start)) return h;
  }
  return null;
}
