import type { Locale } from "@/app/model/settings";
import { LOCALE_TAG, fromDateKey } from "@/shared/lib/date";

/** dateKey 를 로케일 형식으로(Intl). ko: "11월 3일 화요일", "2026년 11월" 등. */
export function formatKey(locale: Locale, dateKey: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? "en-US", opts).format(fromDateKey(dateKey));
}

export const fmtYearMonth = (locale: Locale, dateKey: string) =>
  formatKey(locale, dateKey, { year: "numeric", month: "long" });

export const fmtLongDay = (locale: Locale, dateKey: string) =>
  formatKey(locale, dateKey, { month: "long", day: "numeric", weekday: "long" });

export const fmtMonthDayShort = (locale: Locale, dateKey: string) =>
  formatKey(locale, dateKey, { month: "long", day: "numeric" });

export const fmtMonthShort = (locale: Locale, dateKey: string) =>
  formatKey(locale, dateKey, { month: "short" });

/** 요일 짧게(ko "화", en "Tue"). 0=일. 2026-11-01 이 일요일. */
export const fmtWeekday = (locale: Locale, day: number) =>
  formatKey(locale, `2026-11-0${day + 1}`, { weekday: "short" });

/** 브라우저 시간대 이름(GMT+9). */
export function gmtLabel(): string {
  const off = -new Date().getTimezoneOffset();
  const h = Math.trunc(off / 60);
  const m = Math.abs(off % 60);
  return `GMT${off >= 0 ? "+" : "-"}${Math.abs(h)}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}
