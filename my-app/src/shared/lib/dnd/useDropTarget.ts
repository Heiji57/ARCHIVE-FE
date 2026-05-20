import { useEffect, useId, useRef } from "react";
import { useDnd, type DragKind, type DragPayload } from "./DndContext";

/**
 * Attach to a container that accepts drops of a given kind.
 * Returns a ref + a boolean indicating whether the pointer is currently over it.
 */
export function useDropTarget<K extends DragKind>(
  kind: K,
  onDrop: (payload: DragPayload<K>) => void,
) {
  const id = useId();
  const ref = useRef<HTMLDivElement | null>(null);
  const { state, registerDrop } = useDnd();
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    if (!ref.current) return;
    const unregister = registerDrop({
      id,
      kind,
      element: ref.current,
      onDrop: (payload) => onDropRef.current(payload as DragPayload<K>),
    });
    return unregister;
  }, [id, kind, registerDrop]);

  const isOver = state.overTargetId === id;
  const isActive = state.payload?.kind === kind;

  return { ref, isOver, isActive };
}
