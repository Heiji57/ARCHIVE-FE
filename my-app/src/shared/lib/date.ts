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

/**
 * 주어진 IANA 타임존 기준 "오늘"의 dateKey(YYYY-MM-DD).
 * timeZone 생략 시 브라우저 로컬 기준.
 * (서버가 기간을 user.timezone 으로 계산하므로 FE의 "오늘"도 동일 기준이어야 함)
 */
export function todayKeyInTz(timeZone?: string): string {
  if (!timeZone) return todayKey();
  try {
    // en-CA 로케일은 YYYY-MM-DD 형식을 반환
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return todayKey();
  }
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

// ─── GitHub push periodKey 계산 ──────────────────────────────────────────────

/** ISO 주(週) Monday 날짜를 반환 (로컬 시간 기준, hour=12으로 고정) */
function isoWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const day = d.getDay(); // 0=Sun
  const offset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - offset);
  return d;
}

/** weekStart 에서 시작하는 7일 중 가장 많이 포함된 달(majority-day 방식)을 반환 */
function weekMajorityMonth(weekStart: Date): { year: number; month: number } {
  const counts = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + i,
      12,
    );
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let bestKey = "";
  let best = 0;
  for (const [k, v] of counts) {
    if (v > best) {
      best = v;
      bestKey = k;
    }
  }
  const [y, m] = bestKey.split("-");
  return { year: Number(y), month: Number(m) };
}

/**
 * weekStart 이 year/month(0-based) 에서 몇 번째 majority-day 주인지 반환 (1-based).
 * majority-day = 해당 7일 중 4일 이상이 포함된 달.
 */
function weekNumberInMonth(
  weekStart: Date,
  year: number,
  month: number,
): number {
  // 해당 month 의 1일을 ISO-week Monday 로 당긴다
  const firstOfMonth = new Date(year, month, 1, 12);
  let cursor = isoWeekMonday(firstOfMonth);
  // cursor 의 majority 가 year/month 가 될 때까지 전진
  while (true) {
    const { year: cy, month: cm } = weekMajorityMonth(cursor);
    if (cy === year && cm === month) break;
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + 7,
      12,
    );
  }
  // weekStart 까지 year/month majority 인 주 개수 세기
  let n = 0;
  let c = new Date(cursor);
  while (c.getTime() <= weekStart.getTime() + 1000) {
    const { year: cy, month: cm } = weekMajorityMonth(c);
    if (cy === year && cm === month) n++;
    c = new Date(c.getFullYear(), c.getMonth(), c.getDate() + 7, 12);
  }
  return n;
}

/**
 * 회고 retroType + dateKey 로부터 GitHub push 용 periodKey 를 계산한다.
 * - daily:   YYYY-MM-DD  (= dateKey 그대로)
 * - weekly:  YYYY-MM-Wn  (majority-day 방식, n=1~6)
 * - monthly: YYYY-MM
 * - yearly:  YYYY
 */
export function toPeriodKey(
  retroType: "daily" | "weekly" | "monthly" | "yearly",
  dateKey: string,
): string {
  switch (retroType) {
    case "daily":
      return dateKey;
    case "monthly":
      return dateKey.slice(0, 7); // YYYY-MM
    case "yearly":
      return dateKey.slice(0, 4); // YYYY
    case "weekly": {
      const date = fromDateKey(dateKey);
      const weekStart = isoWeekMonday(date);
      const { year, month } = weekMajorityMonth(weekStart);
      const n = weekNumberInMonth(weekStart, year, month);
      const mm = String(month + 1).padStart(2, "0");
      return `${year}-${mm}-W${n}`;
    }
  }
}

/** True if a "done" todo should be hidden from the Todo board (24h after completion). */
export function isHiddenAfterDone(completedAt: string | null | undefined, now = Date.now()) {
  if (!completedAt) return false;
  const t = new Date(completedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t >= 24 * 60 * 60 * 1000;
}
