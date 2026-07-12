import { useEffect, useState } from "react";
import type { AppRoute } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { findTodoById } from "@/entities/todo/lib/selectors";
import { TaskDetailPanel } from "@/entities/todo/ui/TaskDetailPanel";
import { useTranslation } from "@/shared/lib/i18n";
import { COLS } from "../model/constants";
import { useKanbanFilter } from "../model/useKanbanFilter";
import { KanbanColumn } from "./KanbanColumn";
import { QuickCapture } from "./QuickCapture";
import { TodoFilterRow } from "./TodoFilterRow";

export interface TodoBoardProps {
  onNavigate: (route: AppRoute) => void;
}

export function TodoBoard({ onNavigate }: TodoBoardProps) {
  const { state, addTodo, updateTodo, setTodoTime, removeTodo, toggleTodoCalendarLink, loadTodosForRange, pushNotification } =
    useArchiveApp();
  const { t } = useTranslation();
  const rangeDays = state.settings.todoBoardRangeDays;
  const { filter, setFilter, todayK, grouped } = useKanbanFilter(state.todos, rangeDays);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 보드 진입 시 + 기간 설정 변경 시 "전체" 보기 범위의 할 일을 로드한다.
  // (loadTodosForRange 는 useCallback([]) 으로 안정화되어 있어 deps 에서 제외한다.)
  useEffect(() => {
    void loadTodosForRange(rangeDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const selectedTodo = selectedId
    ? findTodoById(state.todos, selectedId)
    : null;

  const handleSubmit = (text: string, dateKey: string) => {
    // 새 할 일의 Google Calendar push 여부는 calendarAutoPushTodo 설정을 따른다
    // (pushToCalendar: null → 서버가 설정값으로 처리).
    addTodo(text, dateKey, { status: "not-start", pushToCalendar: null }, setSelectedId);
    pushNotification(
      "success",
      t("todo.notif.added.title"),
      `"${text}" — ${dateKey}`,
    );
  };

  return (
    <div className="page todo-page">
      <QuickCapture onSubmit={handleSubmit} />

      <TodoFilterRow filter={filter} onChange={setFilter} todayKey={todayK} />

      <div className="kanban-grid">
        {COLS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            items={grouped[col.id]}
            onUpdate={updateTodo}
            onSelect={setSelectedId}
          />
        ))}
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
