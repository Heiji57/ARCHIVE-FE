import { useEffect, useMemo, useState } from "react";
import { getVisibleBoardTodos } from "@/entities/todo/lib/selectors";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import {
  endOfWeek,
  fromDateKey,
  startOfWeek,
  toDateKey,
} from "@/shared/lib/date";
import type { DateFilter } from "./constants";

/**
 * Manages the Todo board's date filter + grouped (status) view of todos.
 *
 * Also ticks once a minute so the 24h-after-done auto-hide updates
 * without requiring a manual refresh.
 */
export function useKanbanFilter(todos: Todo[]) {
  const [filter, setFilter] = useState<DateFilter>({ kind: "all" });

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const today = new Date();
  const todayK = toDateKey(today);

  const filteredTodos = useMemo(() => {
    const visible = getVisibleBoardTodos(todos);
    if (filter.kind === "all") return visible;
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
  }, [todos, filter, todayK, today]);

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
