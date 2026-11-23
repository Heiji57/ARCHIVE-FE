import type { Todo } from "@/entities/todo/model/types";
import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";

const DAY_MS = 864e5;

/** b - a (일). dateKey 끼리. */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / DAY_MS);
}

export function addDaysKey(dateKey: string, n: number): string {
  return toDateKey(addDays(fromDateKey(dateKey), n));
}

/** 마감일이 시작과 다른 날인 "기간 할 일"(날짜 칸 막대로 그림). */
export function isMultiDay(todo: Todo): boolean {
  return !!todo.dueDate && todo.dueDate > todo.dateKey;
}

/** 그 날에 걸치는지(기간 할 일은 시작~마감). */
export function isOnDay(todo: Todo, dateKey: string): boolean {
  return todo.dateKey <= dateKey && dateKey <= (isMultiDay(todo) ? todo.dueDate! : todo.dateKey);
}

export type DueTone = "" | "soon" | "late" | "ok";
export interface DueInfo {
  kind: "left" | "today" | "late" | "done";
  /** left: 남은 날, late: 지난 날. */
  days: number;
  tone: DueTone;
}

/** 마감 표시: D-N(2일 이하 soon) / 오늘 마감 / N일 지남 / 완료. */
export function dueInfo(todo: Todo, todayKey: string): DueInfo {
  if (todo.status === "done") return { kind: "done", days: 0, tone: "ok" };
  const n = daysBetween(todayKey, todo.dueDate ?? todo.dateKey);
  if (n > 0) return { kind: "left", days: n, tone: n <= 2 ? "soon" : "" };
  if (n === 0) return { kind: "today", days: 0, tone: "soon" };
  return { kind: "late", days: -n, tone: "late" };
}

/**
 * 기간 막대 바탕 진하기(시안 마감 표시 4번 "열기"): 상태 색 하나로, 마감까지 7일 이상 16% → 당일 46%,
 * 지나면 46% + 빗금, 완료는 고르게 12%.
 */
export function spanHeat(todo: Todo, todayKey: string): { pct: number; late: boolean; done: boolean } {
  if (todo.status === "done") return { pct: 12, late: false, done: true };
  const left = daysBetween(todayKey, todo.dueDate ?? todo.dateKey);
  if (left < 0) return { pct: 46, late: true, done: false };
  return { pct: Math.round(46 - (Math.min(left, 7) / 7) * 30), late: false, done: false };
}

const pad = (n: number) => String(n).padStart(2, "0");
const ap = (min: number) => {
  const m = Math.round(min) % 1440;
  const h = Math.floor(m / 60);
  return { h12: h % 12 || 12, mm: m % 60, p: h < 12 ? "AM" : "PM" };
};

/** 화면 표시용 12시간제. short 면 정각의 분을 뺀다(9 AM). */
export function formatClock(min: number, short = false): string {
  const x = ap(min);
  if (short && x.mm === 0) return `${x.h12} ${x.p}`;
  return `${x.h12}:${pad(x.mm)} ${x.p}`;
}

/** 범위: 오전·오후가 같으면 한 번만(9:00 ~ 10:30 AM). */
export function formatRange(a: number, b: number): string {
  const x = ap(a);
  const y = ap(b);
  if (x.p === y.p) return `${x.h12}:${pad(x.mm)} ~ ${y.h12}:${pad(y.mm)} ${y.p}`;
  return `${formatClock(a)} ~ ${formatClock(b)}`;
}

export function durationLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "M/D" */
export function monthDay(dateKey: string): string {
  return `${Number(dateKey.slice(5, 7))}/${Number(dateKey.slice(8, 10))}`;
}
