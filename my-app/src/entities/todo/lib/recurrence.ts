import type { Locale } from "@/app/model/settings";
import type { MonthWeek, RecurrenceRule, Weekday } from "@/entities/todo/model/types";
import { fromDateKey } from "@/shared/lib/date";
import type { TranslateFn } from "@/shared/lib/i18n";

/**
 * 반복 규칙 순수 계산 — 프리셋 목록, 사람이 읽는 문구, 비교, 기준일 변경 시 재계산.
 * 규칙 의미는 RFC 5545 RRULE(서버 domain/utils/recurrence.py)과 같다: 기준일(할 일 dateKey)이
 * 시작일이고, 월간은 "그 달의 n번째 기준일-요일", 연간은 기준일의 월/일.
 */

const WEEKDAYS_MON_TO_FRI: Weekday[] = [0, 1, 2, 3, 4];

/** dateKey 의 요일 — 0=월 … 6=일 (JS getDay 는 0=일). */
export function weekdayOf(dateKey: string): Weekday {
  return ((fromDateKey(dateKey).getDay() + 6) % 7) as Weekday;
}

/**
 * dateKey 로 표현 가능한 월간 "n번째" 값 목록. 보통 [n] 하나지만, 그 달 마지막 주이면
 * -1(마지막)도 함께 — Google Calendar 와 같이 둘 다 고를 수 있게 한다.
 * 5번째 요일은 모든 달에 있지 않으므로 [-1] 만.
 */
export function monthWeekOptions(dateKey: string): MonthWeek[] {
  const d = fromDateKey(dateKey);
  const nth = Math.floor((d.getDate() - 1) / 7) + 1;
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const isLast = d.getDate() + 7 > daysInMonth;
  if (nth === 5) return [-1];
  return isLast ? [nth as MonthWeek, -1] : [nth as MonthWeek];
}

export type RecurrencePresetId = "daily" | "weekly" | "monthly" | "monthlyLast" | "yearly" | "weekdays";

export interface RecurrencePreset {
  id: RecurrencePresetId;
  rule: RecurrenceRule;
}

/** 드롭다운 프리셋 — 모두 기준일에서 계산되고 종료일은 없다(종료일은 맞춤에서 지정). */
export function buildRecurrencePresets(dateKey: string): RecurrencePreset[] {
  const base = { interval: 1, until: null } as const;
  const presets: RecurrencePreset[] = [
    { id: "daily", rule: { ...base, unit: "day" } },
    { id: "weekly", rule: { ...base, unit: "week", weekdays: null } },
  ];
  for (const monthWeek of monthWeekOptions(dateKey)) {
    presets.push({
      id: monthWeek === -1 ? "monthlyLast" : "monthly",
      rule: { ...base, unit: "month", monthWeek },
    });
  }
  presets.push(
    { id: "yearly", rule: { ...base, unit: "year" } },
    { id: "weekdays", rule: { ...base, unit: "week", weekdays: [...WEEKDAYS_MON_TO_FRI] } },
  );
  return presets;
}

/**
 * 비교용 정규화 — 단위와 무관한 필드를 지우고, 주간 weekdays 미지정(null)을 기준일 요일로
 * 채운다. 그래야 서버가 돌려준 `weekdays: null` 규칙과 프리셋/맞춤 규칙을 같은 기준으로 비교한다.
 */
export function normalizeRecurrenceRule(rule: RecurrenceRule, dateKey: string): RecurrenceRule {
  return {
    unit: rule.unit,
    interval: rule.interval,
    until: rule.until ?? null,
    weekdays:
      rule.unit === "week"
        ? [...(rule.weekdays?.length ? rule.weekdays : [weekdayOf(dateKey)])].sort((a, b) => a - b)
        : null,
    monthWeek: rule.unit === "month" ? (rule.monthWeek ?? monthWeekOptions(dateKey)[0]) : null,
  };
}

export function sameRecurrenceRule(a: RecurrenceRule, b: RecurrenceRule, dateKey: string): boolean {
  const x = normalizeRecurrenceRule(a, dateKey);
  const y = normalizeRecurrenceRule(b, dateKey);
  return (
    x.unit === y.unit &&
    x.interval === y.interval &&
    x.until === y.until &&
    x.monthWeek === y.monthWeek &&
    (x.weekdays ?? []).join(",") === (y.weekdays ?? []).join(",")
  );
}

/**
 * 기준일이 바뀌었을 때(QuickCapture 에서 날짜 변경) 규칙을 새 날짜에 맞춘다 — 월간 n번째는
 * 날짜에서 나오므로 다시 계산하고, "마지막"은 새 날짜도 마지막 주이면 유지한다.
 * 주간 weekdays 는 명시값이면 그대로(맞춤), null 이면 원래부터 기준일을 따라간다.
 */
export function rebaseRecurrenceRule(rule: RecurrenceRule, dateKey: string): RecurrenceRule {
  if (rule.unit !== "month") return rule;
  const options = monthWeekOptions(dateKey);
  const monthWeek = rule.monthWeek === -1 && options.includes(-1) ? -1 : options[0];
  return { ...rule, monthWeek };
}

// ── 문구 ────────────────────────────────────────────────────────────────────────

/** 0=월 … 6=일 → 현지화 요일명. 2024-01-01 은 월요일. */
export function weekdayName(weekday: Weekday, locale: Locale, style: "long" | "short"): string {
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(new Date(2024, 0, 1 + weekday));
}

/** dateKey 의 현지화 "월 일" (예: "10월 7일", "October 7"). */
export function monthDayLabel(dateKey: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric" }).format(fromDateKey(dateKey));
}

const NTH_KEYS = {
  1: "todo.recurrence.nth.1",
  2: "todo.recurrence.nth.2",
  3: "todo.recurrence.nth.3",
  4: "todo.recurrence.nth.4",
  [-1]: "todo.recurrence.nth.last",
} as const;

export function monthWeekLabel(monthWeek: MonthWeek, t: TranslateFn): string {
  return t(NTH_KEYS[monthWeek]);
}

/** "매주 수요일" / "2주마다 월, 수" / "매월 첫 번째 수요일" / "매년 10월 7일, 2026-12-31까지" … */
export function formatRecurrenceRule(
  rule: RecurrenceRule,
  dateKey: string,
  t: TranslateFn,
  locale: Locale,
): string {
  const r = normalizeRecurrenceRule(rule, dateKey);
  const n = r.interval;
  let label: string;
  switch (r.unit) {
    case "day":
      label = n === 1 ? t("todo.recurrence.rule.daily") : t("todo.recurrence.rule.everyNDays", { n });
      break;
    case "week": {
      const weekdays = r.weekdays ?? [];
      if (n === 1 && weekdays.join(",") === WEEKDAYS_MON_TO_FRI.join(",")) {
        label = t("todo.recurrence.rule.weekdays");
        break;
      }
      const days =
        weekdays.length === 1
          ? weekdayName(weekdays[0], locale, "long")
          : weekdays.map((d) => weekdayName(d, locale, "short")).join(", ");
      label =
        n === 1
          ? t("todo.recurrence.rule.weekly", { days })
          : t("todo.recurrence.rule.everyNWeeks", { n, days });
      break;
    }
    case "month": {
      const vars = {
        n,
        nth: monthWeekLabel(r.monthWeek ?? 1, t),
        weekday: weekdayName(weekdayOf(dateKey), locale, "long"),
      };
      label =
        n === 1 ? t("todo.recurrence.rule.monthly", vars) : t("todo.recurrence.rule.everyNMonths", vars);
      break;
    }
    case "year": {
      const date = monthDayLabel(dateKey, locale);
      label =
        n === 1
          ? t("todo.recurrence.rule.yearly", { date })
          : t("todo.recurrence.rule.everyNYears", { n, date });
      break;
    }
  }
  return r.until ? t("todo.recurrence.rule.until", { rule: label, date: r.until }) : label;
}
