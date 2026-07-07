import type { TranslationKey } from "@/shared/lib/i18n";

/**
 * "전체" 보기 기간 슬라이더의 스냅 지점.
 * 1주(7일)부터 1년(365일)까지 사람이 읽기 좋은 구간으로 스냅한다.
 * `days` 는 저장/조회에 쓰는 실제 값, `unitKey`+`n` 은 라벨 렌더용.
 */
export interface TodoRangeStop {
  days: number;
  unitKey: TranslationKey;
  n: number;
}

export const TODO_RANGE_STOPS: TodoRangeStop[] = [
  { days: 7, unitKey: "settings.todoRange.unit.week", n: 1 },
  { days: 14, unitKey: "settings.todoRange.unit.week", n: 2 },
  { days: 30, unitKey: "settings.todoRange.unit.month", n: 1 },
  { days: 60, unitKey: "settings.todoRange.unit.month", n: 2 },
  { days: 90, unitKey: "settings.todoRange.unit.month", n: 3 },
  { days: 180, unitKey: "settings.todoRange.unit.month", n: 6 },
  { days: 270, unitKey: "settings.todoRange.unit.month", n: 9 },
  { days: 365, unitKey: "settings.todoRange.unit.year", n: 1 },
];

/** 저장된 일수에 가장 가까운 스냅 지점 인덱스를 찾는다(정확 일치 우선, 없으면 근사). */
export function nearestStopIndex(days: number): number {
  const exact = TODO_RANGE_STOPS.findIndex((s) => s.days === days);
  if (exact !== -1) return exact;
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < TODO_RANGE_STOPS.length; i++) {
    const diff = Math.abs(TODO_RANGE_STOPS[i].days - days);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}
