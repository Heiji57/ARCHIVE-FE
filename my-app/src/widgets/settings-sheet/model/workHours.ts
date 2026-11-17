/** 일하는 시간(시안 4번: 블록과 단계 버튼) 계산. 요일은 0=일 ~ 6=토. */

export type WeekStart = "mon" | "sun";

export function hourOf(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

export function timeOf(x: number): string {
  const h = Math.floor(x);
  const m = Math.round((x - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function weekOrder(weekStart: WeekStart): number[] {
  return weekStart === "sun" ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
}

/** 30분 단위로 앞당기거나 늦춘다. 0시~24시 밖으로 나가지 않는다. */
export function stepTime(v: string, deltaHours: number): string {
  return timeOf(Math.min(24, Math.max(0, hourOf(v) + deltaHours)));
}

export function workSummary(days: number[], from: string, to: string) {
  const perDay = Math.max(0, hourOf(to) - hourOf(from));
  return { days: days.length, perDay, total: days.length * perDay };
}

export function niceHours(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}
