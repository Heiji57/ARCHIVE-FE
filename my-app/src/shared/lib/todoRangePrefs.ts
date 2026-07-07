/**
 * 할 일 보드 "전체" 보기 기간 설정의 로컬 영속화.
 *
 * 이 값은 API 계약(/settings)에 없는 FE 전용 UI 선호도이므로 서버로 동기화하지
 * 않고 localStorage 에만 저장한다. (accountType 처럼 toSettings 에서 로컬 값을
 * 보존하는 패턴과 동일한 취지)
 */
const KEY = "archive.todoBoardRangeDays";

/** 유효 범위: 최소 1주(7일) ~ 최대 1년(365일). */
export const TODO_RANGE_MIN_DAYS = 7;
export const TODO_RANGE_MAX_DAYS = 365;

export function readTodoBoardRange(fallback: number): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return fallback;
    const v = Number(raw);
    if (!Number.isFinite(v)) return fallback;
    return Math.max(TODO_RANGE_MIN_DAYS, Math.min(TODO_RANGE_MAX_DAYS, v));
  } catch {
    return fallback;
  }
}

export function writeTodoBoardRange(days: number): void {
  try {
    localStorage.setItem(KEY, String(days));
  } catch {
    /* localStorage 접근 불가(프라이빗 모드 등) 시 무시 */
  }
}
