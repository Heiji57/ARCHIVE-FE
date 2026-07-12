import { memo } from "react";
import { AlignLeft, CalendarDays } from "lucide-react";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { useDraggable } from "@/shared/lib/dnd";
import { useTranslation } from "@/shared/lib/i18n";
import { KANBAN_DRAG_KIND } from "../model/constants";

export interface KanbanCardProps {
  todo: Todo;
  isDone: boolean;
  onUpdate: (
    id: string,
    patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>,
  ) => void;
  onSelect: (id: string) => void;
}

function KanbanCardImpl({ todo, isDone, onUpdate, onSelect }: KanbanCardProps) {
  const { t } = useTranslation();
  const { isDragging, ...dragHandlers } = useDraggable({ kind: KANBAN_DRAG_KIND, data: { id: todo.id } });

  const advance = () => {
    const next: TaskStatus =
      todo.status === "not-start"
        ? "in-progress"
        : todo.status === "in-progress"
          ? "done"
          : "not-start";
    onUpdate(todo.id, { status: next });
  };

  return (
    <div
      className="kanban-card"
      data-done={isDone ? "true" : undefined}
      data-status={todo.status}
      data-draggable="true"
      data-dragging={isDragging ? "true" : undefined}
      {...dragHandlers}
    >
      <div
        className="kanban-card-body"
        onClick={() => onSelect(todo.id)}
        style={{ cursor: "pointer" }}
      >
        <div className="kanban-card-top">
          <p
            className="kanban-card-title"
            data-done={isDone ? "true" : undefined}
          >
            {todo.title}
          </p>
          {todo.description ? (
            <AlignLeft
              className="kanban-card-notes"
              size={13}
              aria-label={t("todo.card.hasNotes")}
            />
          ) : null}
        </div>

        <div className="kanban-card-meta">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
            title={t("todo.card.advance")}
            className="kanban-card-status-btn"
          >
            <StatusIcon status={todo.status} size={15} />
          </button>

          <span className="kanban-card-date">
            <CalendarDays size={11} />
            {todo.dateKey}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized to avoid re-rendering every card when only one
 * todo in the column changes.
 */
export const KanbanCard = memo(KanbanCardImpl);
