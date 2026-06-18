import { useMemo, useState } from "react";
import type { AppRoute } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import { findTodoById } from "@/entities/todo/lib/selectors";
import type { Todo } from "@/entities/todo/model/types";
import { fromDateKey } from "@/shared/lib/date";
import { toDateKey } from "@/shared/lib/date";
import { useCalendarNav } from "../model/useCalendarNav";
import { CalendarToolbar } from "./CalendarToolbar";
import { DayTimeline } from "./DayTimeline";
import { MonthGrid } from "./MonthGrid";
import { TaskDetailPanel } from "@/entities/todo/ui/TaskDetailPanel";
import { WeekGrid } from "./WeekGrid";

export interface CalendarDashboardProps {
  onNavigate: (route: AppRoute) => void;
}

export function CalendarDashboard({ onNavigate }: CalendarDashboardProps) {
  const { state, addTodo, updateTodo, moveTodo, setTodoTime } = useArchiveApp();
  // "오늘" = user.timezone 기준 (데모는 앵커 날짜). useTodayKey 가 분기 처리.
  const todayCellKey = useTodayKey();
  const anchorDate = useMemo(
    () => fromDateKey(todayCellKey),
    [todayCellKey],
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

        {view === "day" ? (
          <DayTimeline
            dayKey={toDateKey(cursor)}
            todayKey={todayCellKey}
            todos={state.todos}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReschedule={(id, startTime, endTime) =>
              setTodoTime(id, startTime, endTime)
            }
          />
        ) : view === "week" ? (
          <WeekGrid
            cursor={cursor}
            byDate={byDate}
            todayKey={todayCellKey}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDropTodo={handleDropTodo}
            onAddTodo={(title, dateKey) =>
            addTodo(title, dateKey, undefined, setSelectedId)
          }
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
            onSetTime={(startTime, endTime) =>
              setTodoTime(selectedTodo.id, startTime, endTime)
            }
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
