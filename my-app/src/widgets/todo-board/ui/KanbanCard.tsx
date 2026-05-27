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
    <div
      style={{
        background: isDone ? "var(--color-tile-3)" : "var(--color-tile-2)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--color-divider-soft)",
        padding: "12px 14px 14px 10px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <button
        type="button"
        onClick={advance}
        title={t("todo.card.advance")}
        style={{ marginTop: 2, flexShrink: 0 }}
      >
        <StatusIcon status={todo.status} size={16} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.16px",
            textDecoration: isDone ? "line-through" : "none",
            color: isDone ? "var(--color-body-muted)" : "var(--color-ink)",
          }}
        >
          {todo.title}
        </p>

        {todo.description ? (
          <p
            style={{
              margin: "4px 0 8px",
              fontSize: 12,
              color: "var(--color-body-muted)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {todo.description}
          </p>
        ) : (
          <div style={{ height: 4 }} />
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
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
