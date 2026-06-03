import { useMemo, useState } from "react";
import { DEMO_ANCHOR_DATE, DEMO_ANCHOR_DATE_KEY } from "@/app/config/demo";
import type { AppRoute } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { findTodoById } from "@/entities/todo/lib/selectors";
import type { Todo } from "@/entities/todo/model/types";
import { fromDateKey, todayKey } from "@/shared/lib/date";
import { useCalendarNav } from "../model/useCalendarNav";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarToolbar } from "./CalendarToolbar";
import { MonthGrid } from "./MonthGrid";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { WeekGrid } from "./WeekGrid";

export interface CalendarDashboardProps {
  onNavigate: (route: AppRoute) => void;
}

export function CalendarDashboard({ onNavigate }: CalendarDashboardProps) {
  const { state, updateTodo, moveTodo, isDemo } = useArchiveApp();
  // 실제 사용자는 오늘 기준, 데모 모드는 시드 데이터가 정렬된 앵커 날짜 기준.
  const todayCellKey = isDemo ? DEMO_ANCHOR_DATE_KEY : todayKey();
  const anchorDate = useMemo(
    () => (isDemo ? DEMO_ANCHOR_DATE : fromDateKey(todayCellKey)),
    [isDemo, todayCellKey],
  );
  const { view, setView, cursor, navigate, goToday } = useCalendarNav(anchorDate);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTodo = selectedId
    ? findTodoById(state.todos, selectedId)
    : null;

  const byDate = useMemo(() => {
    const m: Record<string, Todo[]> = {};
    for (const item of state.todos) {
      if (!m[item.dateKey]) m[item.dateKey] = [];
      m[item.dateKey].push(item);
    }
    return m;
  }, [state.todos]);

  const handleDropTodo = (todoId: string, dateKey: string) => {
    moveTodo(todoId, dateKey);
  };

  return (
    <div>
      <div className="page calendar-page">
        <CalendarToolbar
          view={view}
          cursor={cursor}
          onViewChange={setView}
          onPrev={() => navigate(-1)}
          onToday={goToday}
          onNext={() => navigate(1)}
        />

        {view === "week" ? (
          <WeekGrid
            cursor={cursor}
            byDate={byDate}
            todayKey={todayCellKey}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDropTodo={handleDropTodo}
          />
        ) : (
          <MonthGrid
            cursor={cursor}
            byDate={byDate}
            todayKey={todayCellKey}
            onSelect={setSelectedId}
            onDropTodo={handleDropTodo}
          />
        )}

        <CalendarLegend />
      </div>

      <div
        className={`side-panel-overlay ${selectedId ? "open" : ""}`}
        onClick={() => setSelectedId(null)}
      />

      <aside
        className={`side-panel ${selectedId ? "open" : ""}`}
        aria-hidden={!selectedId}
      >
        {selectedTodo ? (
          <TaskDetailPanel
            key={selectedTodo.id}
            todo={selectedTodo}
            onClose={() => setSelectedId(null)}
            onUpdate={(patch) => updateTodo(selectedTodo.id, patch)}
            onGoToRetro={() => {
              onNavigate("retrospectives");
              setSelectedId(null);
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}
