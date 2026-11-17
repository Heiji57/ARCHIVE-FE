import type { Locale } from "@/app/model/settings";
import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import { fromDateKey, LOCALE_TAG } from "@/shared/lib/date";
import type { TranslateFn, TranslationKey } from "@/shared/lib/i18n";
import { cardHead, retroPeriod, summaryWeekNo } from "./retroList";

export const KIND_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "retro.kind.daily",
  weekly: "retro.kind.weekly",
  monthly: "retro.kind.monthly",
  yearly: "retro.kind.yearly",
};

export const KIND_RETRO_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "retro.kind.dailyRetro",
  weekly: "retro.kind.weeklyRetro",
  monthly: "retro.kind.monthlyRetro",
  yearly: "retro.kind.yearlyRetro",
};

const tag = (locale: Locale) => LOCALE_TAG[locale] ?? "en";

export const monthName = (locale: Locale, month: number) =>
  new Intl.DateTimeFormat(tag(locale), { month: "long" }).format(new Date(2026, month - 1, 1, 12));

export const weekdayLong = (locale: Locale, dateKey: string) =>
  new Intl.DateTimeFormat(tag(locale), { weekday: "long" }).format(fromDateKey(dateKey));

/** "2026년 11월 2일 월요일" */
export const longDate = (locale: Locale, dateKey: string) =>
  new Intl.DateTimeFormat(tag(locale), { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(fromDateKey(dateKey));

/** "11월 2일 월요일" */
export const shortDate = (locale: Locale, dateKey: string) =>
  new Intl.DateTimeFormat(tag(locale), { month: "long", day: "numeric", weekday: "long" }).format(fromDateKey(dateKey));

/** 묶음 머리 "2026년 11월" 또는 "2025년" */
export const groupLabel = (locale: Locale, monthKey: string) =>
  monthKey.length === 4
    ? new Intl.DateTimeFormat(tag(locale), { year: "numeric" }).format(new Date(+monthKey, 0, 1, 12))
    : new Intl.DateTimeFormat(tag(locale), { year: "numeric", month: "long" }).format(new Date(+monthKey.slice(0, 4), +monthKey.slice(5, 7) - 1, 1, 12));

/** 제목이 비었을 때 쓰는 이름(시안: "11월 1일 회고", "10월 4주차 회고", "10월 회고", "2025년 회고"). */
export function defaultTitle(t: TranslateFn, locale: Locale, type: RetrospectiveType, dateKey: string): string {
  const p = retroPeriod(type, dateKey);
  switch (type) {
    case "weekly": {
      const w = summaryWeekNo(dateKey);
      return t("retro.tt.weekly", { m: w.month, n: w.week, monthName: monthName(locale, w.month) });
    }
    case "monthly":
      return t("retro.tt.monthly", { m: +p.start.slice(5, 7), monthName: monthName(locale, +p.start.slice(5, 7)) });
    case "yearly":
      return t("retro.tt.yearly", { y: p.start.slice(0, 4) });
    default:
      return t("retro.tt.daily", { m: +dateKey.slice(5, 7), d: +dateKey.slice(8, 10), monthName: monthName(locale, +dateKey.slice(5, 7)) });
  }
}

/** 기존 서버 기본 제목("2026-11-03 일일 회고")이나 빈 제목이면 기본 이름으로 보인다. 요약은 늘 기간 이름. */
export function retroTitle(t: TranslateFn, locale: Locale, e: JournalEntry): string {
  const raw = e.title.trim();
  if (e.isSummary || !raw || /^\d{4}-\d{2}-\d{2}\s/.test(raw)) return defaultTitle(t, locale, e.retroType, e.dateKey);
  return raw;
}

/** 편집기 위 기간 글자 */
export function periodText(locale: Locale, e: Pick<JournalEntry, "retroType" | "dateKey">): string {
  const h = cardHead(e);
  switch (h.kind) {
    case "range":
      return `${h.start} ~ ${h.end}`;
    case "month":
      return new Intl.DateTimeFormat(tag(locale), { year: "numeric", month: "long" }).format(new Date(h.year, h.month - 1, 1, 12));
    case "year":
      return new Intl.DateTimeFormat(tag(locale), { year: "numeric" }).format(new Date(h.year, 0, 1, 12));
    default:
      return longDate(locale, e.dateKey);
  }
}

/** 월간 카드 숫자와 단위("10" + "월"). 한국어가 아니면 단위 없이 숫자. */
export function monthParts(locale: Locale, month: number): { n: string; unit: string } {
  const s = new Intl.DateTimeFormat(tag(locale), { month: "numeric" }).format(new Date(2026, month - 1, 1, 12));
  const m = /^(\d+)(\D*)$/.exec(s);
  return m ? { n: m[1], unit: m[2] } : { n: String(month), unit: "" };
}
