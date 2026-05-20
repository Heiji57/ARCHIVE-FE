import type { Locale } from "@/app/model/settings";

const LOCALE_TAG: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function clone(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function addDays(date: Date, amount: number) {
  const next = clone(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

export function startOfWeek(date: Date) {
  const next = clone(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

export function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

export function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 12);
}

export function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 12);
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function isInRange(dateKey: string, start: Date, end: Date) {
  const t = fromDateKey(dateKey).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/** ISO 8601 week number (Mon-based) */
export function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWeekKey(date: Date): string {
  return `${date.getFullYear()}-W${pad(getISOWeek(date))}`;
}

export function formatMonthLabel(date: Date, locale: Locale = "ko") {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    year: "numeric",
    month: "long",
  }).format(date);
}

export function formatYearMonth(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function formatFullDate(date: Date, locale: Locale = "ko") {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

export function getMonthGrid(date: Date) {
  const calendarStart = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
}

/** Calendar grid in compact form: weeks of 7 days, only enough to cover the month */
export function getMonthGridCompact(date: Date) {
  const calendarStart = startOfWeek(startOfMonth(date));
  const calendarEnd = endOfWeek(endOfMonth(date));
  const days: Date[] = [];
  let cursor = calendarStart;
  while (cursor.getTime() <= calendarEnd.getTime()) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** True if a "done" todo should be hidden from the Todo board (24h after completion). */
export function isHiddenAfterDone(completedAt: string | null | undefined, now = Date.now()) {
  if (!completedAt) return false;
  const t = new Date(completedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t >= 24 * 60 * 60 * 1000;
}
