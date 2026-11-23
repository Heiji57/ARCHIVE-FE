/**
 * 회고 목록의 순수 계산(시안 d-retro2.html 회고 영역).
 * 요약(주간/월간/연간)의 dateKey 는 기간의 마지막 날이고 주는 ISO(월~일)다(서버 계약).
 */
import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import { addDays, endOfISOWeek, endOfMonth, fromDateKey, startOfISOWeek, toDateKey } from "@/shared/lib/date";

export interface RetroPeriod {
  start: string;
  end: string;
}

/** 회고 한 편이 덮는 기간. */
export function retroPeriod(type: RetrospectiveType, dateKey: string): RetroPeriod {
  const d = fromDateKey(dateKey);
  switch (type) {
    case "weekly":
      return { start: toDateKey(startOfISOWeek(d)), end: toDateKey(endOfISOWeek(d)) };
    case "monthly":
      return { start: `${dateKey.slice(0, 7)}-01`, end: toDateKey(endOfMonth(d)) };
    case "yearly":
      return { start: `${dateKey.slice(0, 4)}-01-01`, end: `${dateKey.slice(0, 4)}-12-31` };
    default:
      return { start: dateKey, end: dateKey };
  }
}

const startOf = (x: JournalEntry) => retroPeriod(x.retroType, x.dateKey).start;

/** 목록 순서: 기간 시작일 최신순(같으면 id 역순으로 고정). */
export function sortForList(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => startOf(b).localeCompare(startOf(a)) || b.id.localeCompare(a.id));
}

export interface MonthGroup {
  /** "2026-11" 또는 연간 요약만 모인 묶음이면 "2025". */
  monthKey: string;
  yearOnly: boolean;
  count: number;
  entries: JournalEntry[];
}

/** 정렬된 목록을 기간 시작 달마다 묶는다(시안 "2026년 11월 2편"). 연간 요약은 해로 묶는다. */
export function groupByMonth(entries: JournalEntry[]): MonthGroup[] {
  const out: MonthGroup[] = [];
  for (const x of entries) {
    const yearOnly = x.retroType === "yearly";
    const s = startOf(x);
    const key = yearOnly ? s.slice(0, 4) : s.slice(0, 7);
    let last = out[out.length - 1];
    if (!last || last.monthKey !== key) {
      last = { monthKey: key, yearOnly, count: 0, entries: [] };
      out.push(last);
    }
    last.entries.push(x);
    last.count++;
  }
  return out;
}

export type CardHead =
  | { kind: "day"; day: number; dateKey: string }
  | { kind: "range"; start: string; end: string }
  | { kind: "month"; month: number; year: number }
  | { kind: "year"; year: number };

const md = (k: string) => `${+k.slice(5, 7)}/${+k.slice(8, 10)}`;

/** 카드 머리의 큰 날짜 자리(일간 날짜, 주간 M/D ~ M/D, 월간 달, 연간 해). */
export function cardHead(x: Pick<JournalEntry, "retroType" | "dateKey">): CardHead {
  const p = retroPeriod(x.retroType, x.dateKey);
  switch (x.retroType) {
    case "weekly":
      return { kind: "range", start: md(p.start), end: md(p.end) };
    case "monthly":
      return { kind: "month", month: +p.start.slice(5, 7), year: +p.start.slice(0, 4) };
    case "yearly":
      return { kind: "year", year: +p.start.slice(0, 4) };
    default:
      return { kind: "day", day: +x.dateKey.slice(8, 10), dateKey: x.dateKey };
  }
}

/** 주간 요약 제목("10월 4주차 회고")의 달과 n: 기간 시작일이 그 달의 몇째 칠일인지. */
export function summaryWeekNo(dateKey: string): { month: number; week: number } {
  const s = retroPeriod("weekly", dateKey).start;
  return { month: +s.slice(5, 7), week: Math.ceil(+s.slice(8, 10) / 7) };
}

export interface PeriodRange {
  from: string;
  to: string;
  level: "year" | "month" | "week";
}

const lastDayOf = (y: number, m: number) => new Date(y, m, 0, 12).getDate();
const pad = (n: number) => String(n).padStart(2, "0");

/** 그 달의 주 수(일요일에 시작하는 달력 줄 수). */
export function monthWeekCount(year: number, month: number): number {
  const firstDow = new Date(year, month - 1, 1, 12).getDay();
  return Math.ceil((firstDow + lastDayOf(year, month)) / 7);
}

/**
 * 연, 월, 주 고르기를 기간 하나로. 주는 그 달의 n번째 달력 줄(일요일 시작)을 그 달 안으로 자른 것.
 * 연도가 "all"이면 null(거르지 않음).
 */
export function periodRange(year: string, month: string, week: string): PeriodRange | null {
  if (year === "all") return null;
  const y = Number(year);
  if (month === "all") return { from: `${year}-01-01`, to: `${year}-12-31`, level: "year" };
  const m = Number(month);
  const last = lastDayOf(y, m);
  if (week === "all") return { from: `${year}-${pad(m)}-01`, to: `${year}-${pad(m)}-${pad(last)}`, level: "month" };
  const firstDow = new Date(y, m - 1, 1, 12).getDay();
  const startDay = Math.max(1, (Number(week) - 1) * 7 - firstDow + 1);
  const endDay = Math.min(last, Number(week) * 7 - firstDow);
  return { from: `${year}-${pad(m)}-${pad(startDay)}`, to: `${year}-${pad(m)}-${pad(Math.max(startDay, endDay))}`, level: "week" };
}

/** 기간이 겹치면 true. 월을 고르면 연간 요약, 주를 고르면 월간 요약도 뺀다. */
export function entryInRange(x: Pick<JournalEntry, "retroType" | "dateKey">, r: PeriodRange | null): boolean {
  if (!r) return true;
  if (r.level !== "year" && x.retroType === "yearly") return false;
  if (r.level === "week" && x.retroType === "monthly") return false;
  const p = retroPeriod(x.retroType, x.dateKey);
  return p.start <= r.to && p.end >= r.from;
}

/** 마크다운 본문을 카드 두 줄용 평문으로(머리글 줄은 뺀다). */
export function plainExcerpt(markdown: string, max = 140): string {
  const text = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^#{1,6}\s/.test(l) && !/^(-{3,}|\*{3,})$/.test(l))
    .map((l) =>
      l
        .replace(/^>\s?/, "")
        .replace(/^([-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/, "")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
        .replace(/(\*\*|__|\*|_|~~|`)/g, ""),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, max);
}

export interface PrevAction {
  key: string;
  text: string;
  fromDateKey: string;
}

const NEXT_HEAD = /내일|다음|tomorrow|next/i;

/** 지난 일간 회고(가장 가까운 것부터)에서 '내일/다음' 머리글 아래 목록을 찾는다. 일간이 아니면 빈 목록. */
export function prevActions(entries: JournalEntry[], cur: JournalEntry): PrevAction[] {
  if (cur.retroType !== "daily") return [];
  const before = entries
    .filter((x) => x.retroType === "daily" && x.id !== cur.id && x.dateKey < cur.dateKey && x.content.trim())
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  for (const p of before) {
    const lines = p.content.split(/\r?\n/);
    const out: PrevAction[] = [];
    let inside = false;
    for (const raw of lines) {
      const l = raw.trim();
      const h = /^#{1,6}\s+(.*)$/.exec(l);
      if (h) {
        if (inside && out.length) break;
        inside = NEXT_HEAD.test(h[1]);
        continue;
      }
      if (!inside) continue;
      const li = /^[-*+]\s+(?:\[[ xX]\]\s+)?(.*)$/.exec(l);
      if (li && li[1].trim()) out.push({ key: `${p.id}:${out.length}`, text: plainExcerpt(li[1], 200), fromDateKey: p.dateKey });
    }
    if (out.length) return out;
  }
  return [];
}

/** dateKey 하루 뒤. */
export const nextDayKey = (k: string) => toDateKey(addDays(fromDateKey(k), 1));
