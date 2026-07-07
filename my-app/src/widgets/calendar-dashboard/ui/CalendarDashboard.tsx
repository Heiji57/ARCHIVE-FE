import { useEffect, useMemo, useState } from "react";
import type { AppRoute } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import { findTodoById } from "@/entities/todo/lib/selectors";
import type { Todo } from "@/entities/todo/model/types";
import {
  endOfMonth,
  endOfWeek,
  fromDateKey,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from "@/shared/lib/date";
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
  const { state, addTodo, updateTodo, moveTodo, setTodoTime, removeTodo, loadTodosForView, toggleTodoCalendarLink, focusTarget, clearFocus } =
    useArchiveApp();
  // "오늘" = user.timezone 기준 (데모는 앵커 날짜). useTodayKey 가 분기 처리.
  const todayCellKey = useTodayKey();
  const anchorDate = useMemo(
    () => fromDateKey(todayCellKey),
    [todayCellKey],
  );
  const { view, setView, cursor, setCursor, navigate, goToday } = useCalendarNav(anchorDate);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 확대(전체화면) 모드 — 버튼 또는 Ctrl+Shift+F 로 토글.
  const [expanded, setExpanded] = useState(false);

  // 전역 검색에서 특정 할 일로 이동 요청 → 일간 뷰로 해당 날짜를 열고 상세 패널을 표시.
  useEffect(() => {
    if (focusTarget?.kind !== "todo") return;
    setView("day");
    setCursor(fromDateKey(focusTarget.dateKey));
    setSelectedId(focusTarget.todoId);
    clearFocus();
    // setView/setCursor 는 안정적이므로 focusTarget 만 관찰한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget]);

  // Ctrl/Cmd+Shift+F → 확대 토글, Esc → 확대 닫기.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setExpanded((v) => !v);
        return;
      }
      if (e.key === "Escape") setExpanded((v) => (v ? false : v));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // 확대 중에는 배경 스크롤 잠금.
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  // view 또는 cursor 가 바뀌면 해당 범위의 할 일 + 캘린더 이벤트를 재조회한다.
  // 서버 62일 제한에 맞게 뷰 단위로 요청한다.
  useEffect(() => {
    let from: string;
    let to: string;
    if (view === "day") {
      from = toDateKey(cursor);
      to = from;
    } else if (view === "week") {
      from = toDateKey(startOfWeek(cursor));
      to = toDateKey(endOfWeek(cursor));
    } else {
      from = toDateKey(startOfMonth(cursor));
      to = toDateKey(endOfMonth(cursor));
    }
    void loadTodosForView(from, to);
    // loadTodosForView 는 useCallback([]) 으로 안정화되어 있으므로 deps 에서 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursor]);

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
    <div className={`calendar-shell${expanded ? " calendar-shell-expanded" : ""}`}>
      <div className="page calendar-page">
        <CalendarToolbar
          view={view}
          cursor={cursor}
          onViewChange={setView}
          onPrev={() => navigate(-1)}
          onToday={goToday}
          onNext={() => navigate(1)}
          expanded={expanded}
          onToggleExpand={() => setExpanded((v) => !v)}
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
            onUntime={(id) => setTodoTime(id, null, null)}
            onAddTodo={(title, dateKey, opts) => {
              addTodo(title, dateKey, undefined, (newId) => {
                setSelectedId(newId);
                setTodoTime(newId, opts.startTime, opts.endTime);
              });
            }}
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
            onAddTodo={(title, dateKey) =>
              addTodo(title, dateKey, undefined, setSelectedId)
            }
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
            onDelete={() => {
              removeTodo(selectedTodo.id);
              setSelectedId(null);
            }}
            onToggleCalendarLink={
              state.calendar.status === "connected" || state.calendar.status === "needs-reauth"
                ? () => toggleTodoCalendarLink(selectedTodo.id)
                : undefined
            }
            calendarNeedsReauth={state.calendar.status === "needs-reauth"}
          />
        ) : null}
      </aside>
    </div>
  );
}
