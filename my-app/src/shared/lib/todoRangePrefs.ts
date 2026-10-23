import type { TodoBoardRange } from "@/app/model/settings";

/**
 * 할 일 보드 "전체" 보기 범위 설정의 로컬 영속화.
 *
 * 이 값은 API 계약(/settings)에 없는 FE 전용 UI 선호도이므로 서버로 동기화하지
 * 않고 localStorage 에만 저장한다. (accountType 처럼 toSettings 에서 로컬 값을
 * 보존하는 패턴과 동일한 취지)
 */
const KEY = "archive.todoBoardRange";
/** 지난/앞으로를 나누기 전의 저장 키(합계 일수). 읽을 때 반씩 나눠 옮긴다. */
const LEGACY_KEY = "archive.todoBoardRangeDays";

/** 한쪽 방향의 유효 범위: 0일(오늘까지) ~ 1년(365일). */
export const TODO_RANGE_MIN_DAYS = 0;
export const TODO_RANGE_MAX_DAYS = 365;

export function clampRangeDays(days: number): number {
  return Math.max(
    TODO_RANGE_MIN_DAYS,
    Math.min(TODO_RANGE_MAX_DAYS, Math.round(days)),
  );
}

function parseRange(raw: string): TodoBoardRange | null {
  try {
    const v = JSON.parse(raw) as Partial<TodoBoardRange>;
    if (!Number.isFinite(v.pastDays) || !Number.isFinite(v.futureDays)) return null;
    return {
      pastDays: clampRangeDays(v.pastDays as number),
      futureDays: clampRangeDays(v.futureDays as number),
    };
  } catch {
    return null;
  }
}

export function readTodoBoardRange(fallback: TodoBoardRange): TodoBoardRange {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw != null) return parseRange(raw) ?? fallback;
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    const legacy = Number(legacyRaw);
    if (legacyRaw != null && Number.isFinite(legacy)) {
      // 예전 값은 오늘 기준 앞뒤로 반씩 나눠 쓰던 합계 — 같은 구간이 되도록 나눈다.
      const total = Math.min(legacy, TODO_RANGE_MAX_DAYS * 2);
      const pastDays = Math.floor(total / 2);
      return { pastDays: clampRangeDays(pastDays), futureDays: clampRangeDays(total - pastDays) };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeTodoBoardRange(range: TodoBoardRange): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(range));
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* localStorage 접근 불가(프라이빗 모드 등) 시 무시 */
  }
}
