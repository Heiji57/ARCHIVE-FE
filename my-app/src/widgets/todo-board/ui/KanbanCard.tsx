import { memo, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";
import { DatePickerPopover } from "./DatePickerPopover";

export interface KanbanCardProps {
  todo: Todo;
  isDone: boolean;
  onUpdate: (
    id: string,
    patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>,
  ) => void;
}

function KanbanCardImpl({ todo, isDone, onUpdate }: KanbanCardProps) {
  const { t } = useTranslation();
  const [dateOpen, setDateOpen] = useState(false);

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
    <div className="kanban-card" data-done={isDone ? "true" : undefined}>
      <button
        type="button"
        onClick={advance}
        title={t("todo.card.advance")}
        className="kanban-card-status-btn"
      >
        <StatusIcon status={todo.status} size={16} />
      </button>

      <div className="kanban-card-body">
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

        <div className="kanban-card-actions">
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
