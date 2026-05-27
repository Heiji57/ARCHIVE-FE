import { memo } from "react";
import type { Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { useDraggable } from "@/shared/lib/dnd";
import { TODO_DRAG_KIND } from "../model/constants";

export interface DraggableTaskCardProps {
  todo: Todo;
  active: boolean;
  onSelect: () => void;
}

function DraggableTaskCardImpl({
  todo,
  active,
  onSelect,
}: DraggableTaskCardProps) {
  const drag = useDraggable({ kind: TODO_DRAG_KIND, data: { id: todo.id } });

  return (
    <button
      type="button"
      onClick={onSelect}
      data-draggable="true"
      {...drag}
      style={{
        textAlign: "left",
        background: active ? "var(--color-tile-4)" : "var(--color-tile-2)",
        border:
          "1px solid " +
          (active ? "var(--color-primary)" : "var(--color-divider-soft)"),
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        transition: "background 120ms, border-color 120ms",
        width: "100%",
      }}
    >
      <div style={{ flex: "0 0 18px", marginTop: 2 }}>
        <StatusIcon status={todo.status} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.16px",
            textDecoration: todo.status === "done" ? "line-through" : "none",
            color:
              todo.status === "done"
                ? "var(--color-body-muted)"
                : "var(--color-ink)",
          }}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "var(--color-body-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {todo.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export const DraggableTaskCard = memo(DraggableTaskCardImpl);
