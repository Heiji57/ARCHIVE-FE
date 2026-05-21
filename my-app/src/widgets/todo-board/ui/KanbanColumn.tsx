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
  const dotColor =
    col.id === "in-progress"
      ? "var(--color-primary)"
      : col.id === "done"
        ? "var(--color-status-done)"
        : "var(--color-ink-muted-48)";

  return (
    <section
      style={{
        background: isDone ? "var(--color-tile-2)" : "var(--color-tile-1)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--color-divider-soft)",
        padding: "20px 18px 22px",
        minHeight: 480,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          paddingInline: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dotColor,
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.2px",
              }}
            >
              {t(col.labelKey)}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--color-body-muted)",
              }}
            >
              {t(col.koKey)}
            </p>
          </div>
        </div>

        <Pill tone={col.tone}>{items.length}</Pill>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <div
            className="dashed"
            style={{
              height: 96,
              fontSize: 12,
              color: "var(--color-ink-muted-48)",
            }}
          >
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
