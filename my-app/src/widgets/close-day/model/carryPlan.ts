import type { Todo } from "@/entities/todo/model/types";
import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";

/** 남은 일 하나에 대한 답. move = 그 날로, keep = 오늘에 두기, done = 이미 끝냄. */
export type CarryAnswer = { kind: "move"; dateKey: string } | { kind: "keep" } | { kind: "done" };
export type CarryAnswers = Readonly<Record<string, CarryAnswer>>;

export interface CarryPatch {
  id: string;
  patch: { dateKey?: string } | { status: "done" };
}

const plus = (d: string, n: number) => toDateKey(addDays(fromDateKey(d), n));
const isRecurring = (t: Todo) => !!t.recurrenceRule || !!t.seriesId || t.isVirtual;
const isPeriod = (t: Todo) => !!t.dueDate && t.dueDate > t.dateKey;

/**
 * 하루 닫기에서 물어볼 남은 일: 그날의 끝내지 않은 할 일. 반복 할 일(다음 회차가 이미 있음)과
 * 기간 할 일(마감까지 이어짐)은 옮기지 않으므로 묻지 않는다.
 */
export function carryCandidates(todos: Todo[], day: string): Todo[] {
  return todos.filter((t) => t.dateKey === day && t.status !== "done" && !isRecurring(t) && !isPeriod(t));
}

/**
 * 답을 할 일 변경 목록으로(시안 carry3.js finish). 답하지 않은 일은 내일로.
 * 1차는 화면이 이 목록을 PATCH 로 차례로 보낸다(서버에 묶음 변경이 생기면 `todoBatch` 로 한 번에).
 */
export function carryPlan(todos: Todo[], day: string, answers: CarryAnswers): CarryPatch[] {
  const tomorrow = plus(day, 1);
  const out: CarryPatch[] = [];
  for (const t of carryCandidates(todos, day)) {
    const a = answers[t.id] ?? { kind: "move", dateKey: tomorrow };
    if (a.kind === "done") out.push({ id: t.id, patch: { status: "done" } });
    else if (a.kind === "move" && a.dateKey !== day) out.push({ id: t.id, patch: { dateKey: a.dateKey } });
  }
  return out;
}

/** 넘길 날: 내일, 그리고 "다른 날에"의 고르기(모레, 사흘 뒤, 다음 주 월요일. 겹치면 한 번). */
export function carryDays(day: string): { tomorrow: string; later: string[] } {
  const tomorrow = plus(day, 1);
  const dow = fromDateKey(day).getDay();
  const nextMon = plus(day, (8 - dow) % 7 || 7);
  const later: string[] = [];
  for (const d of [plus(day, 2), plus(day, 3), nextMon]) if (d !== tomorrow && !later.includes(d)) later.push(d);
  return { tomorrow, later };
}

export type CarryNote =
  | { tone: "late"; kind: "duePassed"; due: string }
  | { tone: "soon"; kind: "dueSameDay" }
  | { tone: "soon"; kind: "dueToday" }
  | { tone: "soon"; kind: "dueTomorrow" }
  | { tone: ""; kind: "gcal" };

/**
 * 고르기 전에 결과 미리 보기(시안 carry3.js fx). target: 옮길 날, null = 오늘에 두기, "done" = 끝냄.
 */
export function carryNotes(t: Todo, target: string | null | "done", day: string): CarryNote[] {
  const o: CarryNote[] = [];
  const tomorrow = plus(day, 1);
  if (target && target !== "done") {
    if (t.dueDate) {
      if (target > t.dueDate) o.push({ tone: "late", kind: "duePassed", due: t.dueDate });
      else if (target === t.dueDate) o.push({ tone: "soon", kind: "dueSameDay" });
    }
    if (t.calendarLinked) o.push({ tone: "", kind: "gcal" });
  } else if (target === null && t.dueDate && t.dueDate <= tomorrow) {
    o.push({ tone: "soon", kind: t.dueDate <= day ? "dueToday" : "dueTomorrow" });
  }
  return o;
}
