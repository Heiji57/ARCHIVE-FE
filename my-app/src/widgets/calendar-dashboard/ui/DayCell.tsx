import { useDropTarget } from "@/shared/lib/dnd";
import { TODO_DRAG_KIND } from "../model/constants";

export interface DayCellProps {
  dateKey: string;
  onDropTodo: (todoId: string, dateKey: string) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Drop-target wrapper for a single calendar day cell.
 * Cards (week + month grids) are dragged into these.
 */
export function DayCell({
  dateKey,
  onDropTodo,
  children,
  style,
}: DayCellProps) {
  const { ref, isOver, isActive } = useDropTarget<typeof TODO_DRAG_KIND>(
    TODO_DRAG_KIND,
    (payload) => {
      const data = payload.data as { id: string };
      onDropTodo(data.id, dateKey);
    },
  );

  return (
    <div
      ref={ref}
      data-drop-active={isActive}
      data-drop-over={isOver}
      style={style}
    >
      {children}
    </div>
  );
}
