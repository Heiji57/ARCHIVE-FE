import type { Locale } from "@/app/model/settings";
import { LOCALE_TAG } from "@/shared/lib/date";
import type { TranslationKey } from "@/shared/lib/i18n";

type T = (k: TranslationKey, v?: Record<string, string | number>) => string;

/** 시각 말로(ko "오후 5시", "오후 5시 30분", en "5 PM"). 분은 0이 아닐 때만. */
export function spokenTime(locale: Locale, min: number): string {
  const d = new Date(2026, 0, 1, Math.floor(min / 60), min % 60);
  return new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? "en-US", {
    hour: "numeric",
    ...(min % 60 ? { minute: "2-digit" } : {}),
  }).format(d);
}

/** 걸리는 시간 말로(1시간 40분, 2시간, 30분). */
export function spokenDuration(t: T, min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return t("todos.dur.hm", { h, m });
  if (h) return t("todos.dur.h", { h });
  return t("todos.dur.m", { m });
}
