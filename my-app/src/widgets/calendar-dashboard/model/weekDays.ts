import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";

/** 주 시작 요일. 시안과 같은 일요일이 기본. */
export type WeekStart = "mon" | "sun";

/**
 * 주 시작 요일 설정을 읽는 한 곳. 지금은 서버 설정(03 week_start)이 없어 시안대로 "sun".
 * 설정에 값이 생기면 여기서 읽게 바꾼다(주간 칸, 미니 달력, 월간이 모두 이 값을 쓴다).
 */
export function weekStartPreference(): WeekStart {
  return "sun";
}

/** 0=일 … 6=토 기준으로 주 시작 요일의 요일 번호. */
export function weekStartDay(weekStart: WeekStart): number {
  return weekStart === "sun" ? 0 : 1;
}

/** anchor 가 든 주의 7일(주 시작 요일부터). */
export function weekDays(anchor: Date, weekStart: WeekStart): Date[] {
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 12);
  const back = (a.getDay() - weekStartDay(weekStart) + 7) % 7;
  const first = addDays(a, -back);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** dateKey 가 든 주의 첫날 dateKey. */
export function weekStartOf(dateKey: string, weekStart: WeekStart): string {
  return toDateKey(weekDays(fromDateKey(dateKey), weekStart)[0]);
}

/** 그 달 1일이 든 주의 첫날(월간·미니 달력 칸의 첫 칸). */
export function monthGridStart(dateKey: string, weekStart: WeekStart): string {
  return weekStartOf(`${dateKey.slice(0, 8)}01`, weekStart);
}

/** 요일 머리글 순서(0=일 … 6=토 의 요일 번호 배열). */
export function weekdayOrder(weekStart: WeekStart): number[] {
  const s = weekStartDay(weekStart);
  return Array.from({ length: 7 }, (_, i) => (s + i) % 7);
}
