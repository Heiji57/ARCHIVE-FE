import { addDays, fromDateKey, toDateKey } from "@/shared/lib/date";

/** 할 일 보드가 다루는 기간 창(양끝 포함, "YYYY-MM-DD"). */
export interface BoardRangeWindow {
  from: string;
  to: string;
}

/** 오늘 기준 지난/앞으로 일수. (app 설정의 TodoBoardRange 와 같은 모양) */
export interface BoardRangeDays {
  pastDays: number;
  futureDays: number;
}

/**
 * 보드 "전체" 보기의 기간 창 — 오늘 기준 지난 `pastDays` ~ 앞으로 `futureDays` 구간.
 *
 * 서버 조회(`loadTodosForRange`)와 화면 필터(`useTodoListFilter`)가 **반드시 같은 창**을
 * 써야 하므로 계산을 여기 한 곳에 둔다. 예전에는 양쪽이 각자 계산하면서, 조회는
 * `toDateKey`(날짜)로 경계를 잡고 필터는 `Date`(현재 시각 포함)로 비교해 정오 정규화된
 * `fromDateKey` 와 어긋났고, 그 결과 받아온 경계 하루가 화면에서 통째로 빠졌다.
 *
 * 경계 비교는 항상 dateKey 문자열끼리 한다("YYYY-MM-DD" 는 사전순 = 시간순).
 */
export function boardRangeWindow(range: BoardRangeDays, todayKey: string): BoardRangeWindow {
  const base = fromDateKey(todayKey);
  return {
    from: toDateKey(addDays(base, -range.pastDays)),
    to: toDateKey(addDays(base, range.futureDays)),
  };
}

/** dateKey 가 창 안에 있는지(양끝 포함). */
export function isWithinWindow(dateKey: string, window: BoardRangeWindow): boolean {
  return dateKey >= window.from && dateKey <= window.to;
}
