import { useEffect, useId, useRef } from "react";
import { useLatestRef } from "@/shared/lib/useLatestRef";
import { useDnd } from "./useDnd";
import type { DragKind, DragPayload } from "./dndContext";

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
  // onDrop 은 drop 콜백(비동기)에서만 읽으므로 latest-ref 로 최신값 유지.
  const onDropRef = useLatestRef(onDrop);

  useEffect(() => {
    if (!ref.current) return;
    const unregister = registerDrop({
      id,
      kind,
      element: ref.current,
      onDrop: (payload) => onDropRef.current(payload as DragPayload<K>),
    });
    return unregister;
  }, [id, kind, registerDrop, onDropRef]);

  const isOver = state.overTargetId === id;
  const isActive = state.payload?.kind === kind;

  return { ref, isOver, isActive };
}
