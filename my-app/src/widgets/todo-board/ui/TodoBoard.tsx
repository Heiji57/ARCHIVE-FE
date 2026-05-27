import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import { COLS } from "../model/constants";
import { useKanbanFilter } from "../model/useKanbanFilter";
import { KanbanColumn } from "./KanbanColumn";
import { QuickCapture } from "./QuickCapture";
import { TodoFilterRow } from "./TodoFilterRow";

export function TodoBoard() {
  const { state, addTodo, updateTodo, pushNotification } = useArchiveApp();
  const { t } = useTranslation();
  const { filter, setFilter, todayK, grouped } = useKanbanFilter(state.todos);

  const handleSubmit = (text: string, dateKey: string) => {
    addTodo(text, dateKey, { status: "not-start" });
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
          />
        ))}
      </div>
    </div>
  );
}
