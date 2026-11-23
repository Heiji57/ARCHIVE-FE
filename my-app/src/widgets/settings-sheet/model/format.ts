import type { TranslateFn } from "@/shared/lib/i18n";
import { hourOf } from "./workHours";

/** 요일 이름(0=일). 2023-01-01 은 일요일. */
export function weekdayName(d: number, locale: string, style: "short" | "long" | "narrow" = "short"): string {
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + d)));
}

/** "HH:mm" → "오전 9시", "오후 6:30" / "18:00"(24시간). */
export function formatHm(v: string, locale: string, fmt24 = false): string {
  const x = hourOf(v);
  const h = Math.floor(x);
  const m = Math.round((x - h) * 60);
  if (fmt24 || h >= 24) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: m ? "2-digit" : undefined, timeZone: "UTC" }).format(
    new Date(Date.UTC(2023, 0, 1, h, m)),
  );
}

/** 분 → "1시간 30분". */
export function formatDuration(min: number, t: TranslateFn): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return t("settingsSheet.work.hm", { h, m });
  if (h) return t("settingsSheet.work.h", { h });
  return t("settingsSheet.work.m", { m });
}

export function formatMonthDay(d: Date, locale: string, withWeekday = false): string {
  return d.toLocaleDateString(locale, { month: "long", day: "numeric", weekday: withWeekday ? "long" : undefined });
}

/** "Asia/Seoul" → "Seoul (UTC+9)". */
export function tzLabel(tz: string, locale: string): string {
  const city = (tz.split("/").pop() ?? tz).replace(/_/g, " ");
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    const off = part ? part.replace(/^GMT/, "UTC").replace(/^UTC$/, "UTC+0") : "";
    return off ? `${city} (${off})` : city;
  } catch {
    return city;
  }
}
