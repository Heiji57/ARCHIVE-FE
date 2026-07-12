import type { DateFilter } from "./constants";

/**
 * 할 일 보드 기간 필터(전체/오늘/이번 주/특정 날짜)의 로컬 영속화.
 *
 * API 계약(/settings)에 없는 FE 전용 UI 선호도이므로 서버로 동기화하지 않고
 * localStorage 에만 저장한다. 페이지를 다시 열 때 마지막 필터를 복원한다.
 * ([[todoRangePrefs]] 의 rangeDays 저장과 동일한 취지)
 */
const KEY = "archive.todoBoardFilter";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function readTodoBoardFilter(): DateFilter {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return { kind: "all" };
    const parsed = JSON.parse(raw) as DateFilter;
    switch (parsed?.kind) {
      case "all":
      case "today":
      case "week":
        return { kind: parsed.kind };
      case "specific":
        return typeof parsed.dateKey === "string" && DATE_KEY_RE.test(parsed.dateKey)
          ? { kind: "specific", dateKey: parsed.dateKey }
          : { kind: "all" };
      default:
        return { kind: "all" };
    }
  } catch {
    return { kind: "all" };
  }
}

export function writeTodoBoardFilter(filter: DateFilter): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(filter));
  } catch {
    /* localStorage 접근 불가(프라이빗 모드 등) 시 무시 */
  }
}
