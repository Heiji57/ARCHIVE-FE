import { memo } from "react";
import type { Todo } from "@/entities/todo/model/types";
import { useDraggable } from "@/shared/lib/dnd";
import { TODO_DRAG_KIND } from "../model/constants";

export interface DraggableMonthChipProps {
  todo: Todo;
  onSelect: () => void;
}

function DraggableMonthChipImpl({ todo, onSelect }: DraggableMonthChipProps) {
  const { isDragging, ...dragHandlers } = useDraggable({ kind: TODO_DRAG_KIND, data: { id: todo.id } });

  return (
    <button
      type="button"
      onClick={onSelect}
      data-draggable="true"
      data-dragging={isDragging ? "true" : undefined}
      data-status={todo.status}
      className="todo-month-chip"
      {...dragHandlers}
    >
      {todo.title}
    </button>
  );
}

export const DraggableMonthChip = memo(DraggableMonthChipImpl);
