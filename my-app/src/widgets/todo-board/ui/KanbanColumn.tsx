import type { Todo } from "@/entities/todo/model/types";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";
import type { KanbanColumnConfig } from "../model/constants";
import { KanbanCard, type KanbanCardProps } from "./KanbanCard";

export interface KanbanColumnProps {
  col: KanbanColumnConfig;
  items: Todo[];
  onUpdate: KanbanCardProps["onUpdate"];
}

export function KanbanColumn({ col, items, onUpdate }: KanbanColumnProps) {
  const { t } = useTranslation();
  const isDone = col.id === "done";

  return (
    <section
      className="kanban-col"
      data-done={isDone ? "true" : undefined}
    >
      <div className="kanban-col-head">
        <div className="kanban-col-head-left">
          <span className="kanban-col-dot" data-status={col.id} />
          <div>
            <p className="kanban-col-title">{t(col.labelKey)}</p>
            <p className="kanban-col-subtitle">{t(col.koKey)}</p>
          </div>
        </div>

        <Pill tone={col.tone}>{items.length}</Pill>
      </div>

      <div className="kanban-col-body">
        {items.length === 0 ? (
          <div className="dashed kanban-col-empty">
            {t("todo.col.empty")}
          </div>
        ) : (
          items.map((todoItem) => (
            <KanbanCard
              key={todoItem.id}
              todo={todoItem}
              onUpdate={onUpdate}
              isDone={isDone}
            />
          ))
        )}
      </div>
    </section>
  );
}
