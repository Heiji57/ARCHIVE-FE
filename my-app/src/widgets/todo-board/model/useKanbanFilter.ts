import { useCallback, useEffect, useMemo, useState } from "react";
import { getVisibleBoardTodos } from "@/entities/todo/lib/selectors";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import {
  addDays,
  endOfWeek,
  fromDateKey,
  startOfWeek,
  toDateKey,
} from "@/shared/lib/date";
import type { DateFilter } from "./constants";
import { readTodoBoardFilter, writeTodoBoardFilter } from "./todoFilterPrefs";

/**
 * Manages the Todo board's date filter + grouped (status) view of todos.
 *
 * `rangeDays` 는 "전체" 필터에서 오늘 기준 앞뒤로 나눠 표시할 기간(일)이다.
 *
 * Also ticks once a minute so the 24h-after-done auto-hide updates
 * without requiring a manual refresh.
 */
export function useKanbanFilter(todos: Todo[], rangeDays: number) {
  // 마지막으로 고른 기간 필터를 localStorage 에서 복원한다(페이지 재진입 시 유지).
  const [filter, setFilterState] = useState<DateFilter>(readTodoBoardFilter);
  const setFilter = useCallback((next: DateFilter) => {
    setFilterState(next);
    writeTodoBoardFilter(next);
  }, []);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const today = new Date();
  const todayK = toDateKey(today);

  const filteredTodos = useMemo(() => {
    const visible = getVisibleBoardTodos(todos);
    if (filter.kind === "all") {
      // 오늘 기준 앞뒤로 rangeDays 를 나눈 윈도우 안의 할 일만 표시한다.
      const back = Math.floor(rangeDays / 2);
      const fwd = rangeDays - back;
      const lo = addDays(today, -back).getTime();
      const hi = addDays(today, fwd).getTime();
      return visible.filter((t) => {
        const x = fromDateKey(t.dateKey).getTime();
        return x >= lo && x <= hi;
      });
    }
    if (filter.kind === "today")
      return visible.filter((t) => t.dateKey === todayK);
    if (filter.kind === "week") {
      const ws = startOfWeek(today).getTime();
      const we = endOfWeek(today).getTime();
      return visible.filter((t) => {
        const x = fromDateKey(t.dateKey).getTime();
        return x >= ws && x <= we;
      });
    }
    return visible.filter((t) => t.dateKey === filter.dateKey);
  }, [todos, filter, todayK, today, rangeDays]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Todo[]> = {
      "not-start": [],
      "in-progress": [],
      done: [],
    };
    for (const item of filteredTodos) {
      g[item.status]?.push(item);
    }
    return g;
  }, [filteredTodos]);

  return { filter, setFilter, todayK, filteredTodos, grouped };
}
