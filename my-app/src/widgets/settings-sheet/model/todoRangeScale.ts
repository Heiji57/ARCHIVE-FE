import { TODO_RANGE_MAX_DAYS } from "@/shared/lib/todoRangePrefs";

/**
 * "전체" 보기 범위 눈금자의 시간축.
 * 오늘을 가운데(0.5) 두고 양쪽으로 최대 1년을 그린다. 제곱근 스케일이라 오늘에
 * 가까운 구간이 넓게 펼쳐져, 며칠 단위는 세밀하게·몇 달 단위는 크게 움직인다.
 */

/** 한쪽 방향 일수 → 가운데로부터의 거리(0 ~ 0.5) */
export function offsetForDays(days: number): number {
  return 0.5 * Math.sqrt(Math.min(days, TODO_RANGE_MAX_DAYS) / TODO_RANGE_MAX_DAYS);
}

/** 가운데로부터의 거리(0 ~ 0.5) → 한쪽 방향 일수 */
export function daysForOffset(offset: number): number {
  const ratio = Math.max(0, Math.min(offset, 0.5)) / 0.5;
  return Math.round(TODO_RANGE_MAX_DAYS * ratio * ratio);
}

/** 눈금 위치(일). 3개월·1년은 굵은 눈금, 나머지는 가는 눈금. */
export const RULER_TICKS: Array<{ days: number; major: boolean }> = [
  { days: 7, major: false },
  { days: 30, major: false },
  { days: 90, major: true },
  { days: 180, major: false },
  { days: 365, major: true },
];
