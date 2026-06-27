import { memo, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { Pill } from "@/shared/ui/pill/Pill";
import { useDraggable } from "@/shared/lib/dnd";
import { useTranslation } from "@/shared/lib/i18n";
import { KANBAN_DRAG_KIND } from "../model/constants";
import { DatePickerPopover } from "./DatePickerPopover";

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
  const [dateOpen, setDateOpen] = useState(false);
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
      data-popover-open={dateOpen ? "true" : undefined}
      {...dragHandlers}
    >
      <button
        type="button"
        onClick={advance}
        title={t("todo.card.advance")}
        className="kanban-card-status-btn"
      >
        <StatusIcon status={todo.status} size={16} />
      </button>

      <div
        className="kanban-card-body"
        onClick={() => onSelect(todo.id)}
        style={{ cursor: "pointer" }}
      >
        <p
          className="kanban-card-title"
          data-done={isDone ? "true" : undefined}
        >
          {todo.title}
        </p>

        {todo.description ? (
          <p className="kanban-card-desc">{todo.description}</p>
        ) : (
          <div className="kanban-card-spacer" />
        )}

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
          <Pill
            tone="outline"
            as="button"
            onClick={() => setDateOpen((v) => !v)}
            title={t("todo.card.changeDate")}
          >
            <CalendarDays size={10} />
            {todo.dateKey}
          </Pill>
          <Pill tone="outline" as="button" onClick={advance}>
            <ArrowRight size={10} />
            {t("todo.card.nextStep")}
          </Pill>

          {dateOpen ? (
            <DatePickerPopover
              value={todo.dateKey}
              onChange={(v) => {
                onUpdate(todo.id, { dateKey: v });
                setDateOpen(false);
              }}
              onClose={() => setDateOpen(false)}
              anchorRight={false}
            />
          ) : null}
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
