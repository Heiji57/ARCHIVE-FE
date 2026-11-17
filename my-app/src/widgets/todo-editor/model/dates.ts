import type { RecurrenceRule, Todo } from "@/entities/todo/model/types";
import { normalizeRecurrenceRule, weekdayOf } from "@/entities/todo/lib/recurrence";
import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";

/** 할 일 창의 날짜, 시간 계산(순수). 날짜는 로컬 "YYYY-MM-DD", 시간은 "HH:mm". */

export function shiftDays(dateKey: string, n: number): string {
  return toDateKey(addDays(fromDateKey(dateKey), n));
}

/** from(포함) 이후 처음 오는 요일(0=월 … 6=일). */
export function nextWeekday(from: string, weekday: number): string {
  let d = from;
  for (let i = 0; i < 7; i += 1) {
    if (weekdayOf(d) === weekday) return d;
    d = shiftDays(d, 1);
  }
  return d;
}

/** from 다음 날부터 처음 오는 요일(오늘이 그 요일이면 다음 주). */
function nextWeekdayAfter(from: string, weekday: number): string {
  return nextWeekday(shiftDays(from, 1), weekday);
}

export type QuickDateId = "today" | "tomorrow" | "dayAfter" | "weekend" | "nextMonday";

/** 날짜 메뉴의 빠른 날짜: 오늘, 내일, 모레, 이번 주말(토), 다음 주 월요일. */
export function quickDates(today: string): { id: QuickDateId; dateKey: string }[] {
  return [
    { id: "today", dateKey: today },
    { id: "tomorrow", dateKey: shiftDays(today, 1) },
    { id: "dayAfter", dateKey: shiftDays(today, 2) },
    { id: "weekend", dateKey: nextWeekday(today, 5) },
    { id: "nextMonday", dateKey: nextWeekdayAfter(today, 0) },
  ];
}

export type QuickDueId = "nextDay" | "friday" | "weekLater";

/** 마감일 메뉴의 빠른 날짜: 할 날 기준 다음 날, 그 주 금요일, 일주일 뒤. */
export function quickDueDates(dateKey: string): { id: QuickDueId; dateKey: string }[] {
  return [
    { id: "nextDay", dateKey: shiftDays(dateKey, 1) },
    { id: "friday", dateKey: nextWeekdayAfter(dateKey, 4) },
    { id: "weekLater", dateKey: shiftDays(dateKey, 7) },
  ];
}

/** b - a (일). */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86_400_000);
}

const KO_WEEKDAY = "월화수목금토일";
const EN_WEEKDAY = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 찾기 메뉴에 친 글자를 날짜로: "2026-11-09", "11/9", "11월 9일", "9일", "9", "금", "금요일", "fri".
 * 연도가 없으면 오늘 이후로 가장 가까운 날, 일만 있으면 이번 달(지났으면 다음 달).
 */
export function parseDayQuery(raw: string, today: string): string | null {
  const q = raw.trim().toLowerCase();
  if (!q) return null;
  let m: RegExpMatchArray | null;
  const valid = (y: number, mo: number, d: number) => {
    const key = `${y}-${pad(mo)}-${pad(d)}`;
    return toDateKey(fromDateKey(key)) === key ? key : null;
  };
  if ((m = q.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return valid(+m[1], +m[2], +m[3]);
  const y = +today.slice(0, 4);
  if ((m = q.match(/^(\d{1,2})\s*(?:월|\/)\s*(\d{1,2})\s*일?$/))) {
    const key = valid(y, +m[1], +m[2]);
    if (!key) return null;
    return key < today ? valid(y + 1, +m[1], +m[2]) : key;
  }
  if ((m = q.match(/^(\d{1,2})\s*일?$/))) {
    const mo = +today.slice(5, 7);
    const key = valid(y, mo, +m[1]);
    if (key && key >= today) return key;
    const next = fromDateKey(`${y}-${pad(mo)}-01`);
    next.setMonth(next.getMonth() + 1);
    return valid(next.getFullYear(), next.getMonth() + 1, +m[1]);
  }
  if ((m = q.match(/^([월화수목금토일])(?:요일)?$/))) return nextWeekdayAfter(today, KO_WEEKDAY.indexOf(m[1]));
  const en = EN_WEEKDAY.findIndex((w) => q.startsWith(w) && q.length <= 9);
  if (en >= 0 && /^[a-z]+$/.test(q)) return nextWeekdayAfter(today, en);
  return null;
}

/** "HH:mm" → 분. */
export function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  const v = Math.max(0, Math.min(24 * 60 - 1, min));
  return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
}

/** 시작을 고르면 끝은 지금 길이(없으면 1시간)를 유지한다. 하루를 넘지 않게 23:59 에서 자른다. */
export function shiftTimeRange(
  start: string,
  current: { startTime?: string | null; endTime?: string | null },
): { startTime: string; endTime: string } {
  const len =
    current.startTime && current.endTime ? Math.max(30, toMinutes(current.endTime) - toMinutes(current.startTime)) : 60;
  return { startTime: start, endTime: fromMinutes(toMinutes(start) + len) };
}

/** 시간 메뉴의 칸: 07:00 ~ 21:30, 30분 간격. */
export const TIME_SLOTS: string[] = Array.from({ length: 30 }, (_, i) => fromMinutes(7 * 60 + i * 30));

/** 같은 날 시간이 겹치는(끝내지 않은) 할 일. */
export function overlapping(
  todos: Todo[],
  draft: { id?: string; dateKey: string; startTime: string | null; endTime: string | null },
): Todo[] {
  if (!draft.startTime) return [];
  const s = toMinutes(draft.startTime);
  const e = draft.endTime ? toMinutes(draft.endTime) : s + 60;
  return todos.filter((t) => {
    if (t.id === draft.id || t.dateKey !== draft.dateKey || !t.startTime || t.status === "done") return false;
    const ts = toMinutes(t.startTime);
    const te = t.endTime ? toMinutes(t.endTime) : ts + 60;
    return ts < e && te > s;
  });
}

/** 반복 규칙의 다음 회차들(시작일 포함). 맞춤 반복 미리보기용. */
export function nextOccurrences(rule: RecurrenceRule, startKey: string, count = 4): string[] {
  const r = normalizeRecurrenceRule(rule, startKey);
  const start = fromDateKey(startKey);
  const out: string[] = [];
  const startMonday = shiftDays(startKey, -weekdayOf(startKey));
  for (let i = 0; i < 1500 && out.length < count; i += 1) {
    const key = shiftDays(startKey, i);
    if (r.until && key > r.until) break;
    const d = fromDateKey(key);
    let hit = false;
    if (r.unit === "day") hit = i % r.interval === 0;
    else if (r.unit === "week") {
      const weeks = Math.round(daysBetween(startMonday, shiftDays(key, -weekdayOf(key))) / 7);
      hit = (r.weekdays ?? []).includes(weekdayOf(key)) && weeks % r.interval === 0;
    } else if (r.unit === "month") {
      const months = (d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth();
      const sameWeekday = weekdayOf(key) === weekdayOf(startKey);
      const last = d.getDate() + 7 > new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const nth = Math.ceil(d.getDate() / 7);
      hit = months % r.interval === 0 && sameWeekday && (r.monthWeek === -1 ? last : nth === r.monthWeek);
    } else {
      hit =
        d.getMonth() === start.getMonth() &&
        d.getDate() === start.getDate() &&
        (d.getFullYear() - start.getFullYear()) % r.interval === 0;
    }
    if (hit) out.push(key);
  }
  return out;
}
