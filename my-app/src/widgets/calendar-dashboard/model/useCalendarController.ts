import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useTodayKey } from "@/app/providers/useToday";
import { addDaysKey, daysBetween } from "./eventInfo";
import { monthGridStart, weekStartOf, weekStartPreference, type WeekStart } from "./weekDays";

export type CalendarView = "day" | "week" | "month";

/** 그려 둔 날짜 범위(옆으로·위아래로 이어지는 스크롤). week: 날짜 수, month: 주 수. */
export interface DayRange {
  start: string;
  n: number;
}

export interface JumpRequest {
  seq: number;
  /** false 면 그 날짜가 이미 보이면 옮기지 않는다(미니 달력, 날짜 머리 누르기). */
  force: boolean;
}

export interface CalendarController {
  view: CalendarView;
  /** 고른 날짜(오른쪽 패널 하루, 미니 달력 강조). */
  date: string;
  todayKey: string;
  weekStart: WeekStart;
  weekRange: DayRange;
  monthRange: DayRange;
  jump: JumpRequest;
  setView(v: CalendarView): void;
  pick(dateKey: string, opts?: { view?: CalendarView; force?: boolean }): void;
  goToday(): void;
  /** 단축키 j/k: 다음/이전 날·주·달. */
  step(dir: 1 | -1): void;
  /** 스크롤이 끝에 닿으면 범위를 늘린다. 앞쪽으로 늘린 날짜(일) 수를 돌려준다. */
  extend(kind: "week" | "month", dir: 1 | -1): number;
}

const WEEK_EXTEND = 28;
const MONTH_EXTEND = 8;

const weekRangeFor = (d: string, ws: WeekStart): DayRange => ({ start: addDaysKey(weekStartOf(d, ws), -28), n: 70 });
const monthRangeFor = (d: string, ws: WeekStart): DayRange => ({ start: addDaysKey(monthGridStart(d, ws), -56), n: 26 });

const weekOk = (r: DayRange, d: string) => {
  const i = daysBetween(r.start, d);
  return i >= 14 && i <= r.n - 14;
};
const monthOk = (r: DayRange, d: string) => {
  const i = daysBetween(r.start, d);
  return i >= 28 && i <= r.n * 7 - 42;
};

/**
 * 캘린더 화면 상태(보기, 고른 날짜, 그려 둔 범위, 이동 요청). 페이지가 한 번 만들어 사이드바, 도구 막대,
 * 본문에 같이 넘긴다. AppProvider 밖의 화면 상태.
 */
export function useCalendarController(initialView: CalendarView = "week"): CalendarController {
  const todayKey = useTodayKey();
  const weekStart = weekStartPreference();
  const [s, setS] = useState(() => ({
    view: initialView,
    date: todayKey,
    weekRange: weekRangeFor(todayKey, weekStart),
    monthRange: monthRangeFor(todayKey, weekStart),
    jump: { seq: 0, force: true } as JumpRequest,
  }));

  const go = useCallback(
    (date: string, view: CalendarView | undefined, force: boolean) => {
      setS((p) => {
        const v = view ?? p.view;
        return {
          view: v,
          date,
          weekRange: weekOk(p.weekRange, date) ? p.weekRange : weekRangeFor(date, weekStart),
          monthRange: monthOk(p.monthRange, date) ? p.monthRange : monthRangeFor(date, weekStart),
          jump: { seq: p.jump.seq + 1, force: force || v !== p.view },
        };
      });
    },
    [weekStart],
  );

  const extend = useCallback((kind: "week" | "month", dir: 1 | -1) => {
    const add = kind === "week" ? WEEK_EXTEND : MONTH_EXTEND;
    setS((p) => {
      const key = kind === "week" ? "weekRange" : "monthRange";
      const r = p[key];
      const next = dir < 0 ? { start: addDaysKey(r.start, kind === "week" ? -add : -add * 7), n: r.n + add } : { ...r, n: r.n + add };
      return { ...p, [key]: next };
    });
    return dir < 0 ? (kind === "week" ? add : add * 7) : 0;
  }, []);

  return useMemo<CalendarController>(
    () => ({
      ...s,
      todayKey,
      weekStart,
      setView: (v) => go(s.date, v, true),
      pick: (d, o) => go(d, o?.view, o?.force ?? false),
      goToday: () => go(todayKey, undefined, true),
      step: (dir) => {
        const d =
          s.view === "month"
            ? (() => {
                const [y, m] = s.date.split("-").map(Number);
                const x = new Date(y, m - 1 + dir, 1, 12);
                return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-01`;
              })()
            : addDaysKey(s.date, s.view === "week" ? dir * 7 : dir);
        go(d, undefined, true);
      },
      extend,
    }),
    [s, todayKey, weekStart, go, extend],
  );
}

/* ---------- 보이는 범위(제목, 오늘이 어느 쪽에 있는지): 본문이 스크롤하며 쓰고 도구 막대가 읽는다 ---------- */

export interface CalendarViewport {
  /** 도구 막대 제목에 쓸 기준 날짜(주간: 보이는 주 가운데, 일간: 보이는 날, 월간: 가운데 줄). */
  anchor: string | null;
  todayDir: "in" | "left" | "right" | "up" | "down";
}

let viewport: CalendarViewport = { anchor: null, todayDir: "in" };
const vpListeners = new Set<() => void>();

export function setCalendarViewport(next: CalendarViewport): void {
  if (next.anchor === viewport.anchor && next.todayDir === viewport.todayDir) return;
  viewport = next;
  for (const l of vpListeners) l();
}

export function useCalendarViewport(): CalendarViewport {
  return useSyncExternalStore(
    (l) => {
      vpListeners.add(l);
      return () => {
        vpListeners.delete(l);
      };
    },
    () => viewport,
    () => viewport,
  );
}
