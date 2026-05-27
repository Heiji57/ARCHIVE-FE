import { memo } from "react";
import type { Todo } from "@/entities/todo/model/types";
import { useDraggable } from "@/shared/lib/dnd";
import { TODO_DRAG_KIND } from "../model/constants";

export interface DraggableMonthChipProps {
  todo: Todo;
  onSelect: () => void;
}

function DraggableMonthChipImpl({ todo, onSelect }: DraggableMonthChipProps) {
  const drag = useDraggable({ kind: TODO_DRAG_KIND, data: { id: todo.id } });

  return (
    <button
      type="button"
      onClick={onSelect}
      data-draggable="true"
      {...drag}
      style={{
        textAlign: "left",
        fontSize: 11,
        padding: "3px 6px",
        borderRadius: 4,
        background:
          todo.status === "done"
            ? "var(--color-tile-3)"
            : todo.status === "in-progress"
              ? "rgba(10, 132, 255, 0.16)"
              : "var(--color-tile-2)",
        color:
          todo.status === "done"
            ? "var(--color-body-muted)"
            : todo.status === "in-progress"
              ? "var(--color-primary-on-dark)"
              : "var(--color-ink)",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        textDecoration: todo.status === "done" ? "line-through" : "none",
        width: "100%",
      }}
    >
      {todo.title}
    </button>
  );
}

export const DraggableMonthChip = memo(DraggableMonthChipImpl);
