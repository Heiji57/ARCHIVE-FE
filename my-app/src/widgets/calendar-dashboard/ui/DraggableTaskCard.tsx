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
      data-active={active ? "true" : undefined}
      className="task-card"
      {...drag}
    >
      <div className="task-card-icon">
        <StatusIcon status={todo.status} size={16} />
      </div>
      <div className="task-card-body">
        <p className="task-card-title" data-status={todo.status}>
          {todo.title}
        </p>
        {todo.description ? (
          <p className="task-card-desc">{todo.description}</p>
        ) : null}
      </div>
    </button>
  );
}

export const DraggableTaskCard = memo(DraggableTaskCardImpl);
