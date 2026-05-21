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
    <div className="page" style={{ paddingTop: 40 }}>
      <QuickCapture onSubmit={handleSubmit} />

      <TodoFilterRow filter={filter} onChange={setFilter} todayKey={todayK} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 20,
        }}
      >
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
