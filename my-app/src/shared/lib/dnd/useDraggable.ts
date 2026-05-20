import { useCallback, useRef } from "react";
import { useDnd, type DragKind, type DragPayload } from "./DndContext";

/**
 * Returns handlers to attach to a draggable element.
 *
 * onPointerDown begins the drag *only after the pointer moves a few pixels*
 * to avoid hijacking simple clicks.
 */
export function useDraggable<K extends DragKind, D>(payload: {
  kind: K;
  data: D;
}) {
  const { startDrag } = useDnd();
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const armedRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only left button / primary touch
      if (e.button !== 0 && e.pointerType === "mouse") return;
      startRef.current = { x: e.clientX, y: e.clientY };
      armedRef.current = true;
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!armedRef.current || !startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        armedRef.current = false;
        startDrag(payload as unknown as DragPayload, {
          x: e.clientX,
          y: e.clientY,
        });
      }
    },
    [payload, startDrag],
  );

  const onPointerUp = useCallback(() => {
    armedRef.current = false;
    startRef.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
