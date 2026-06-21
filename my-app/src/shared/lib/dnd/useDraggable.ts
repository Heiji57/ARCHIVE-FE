import { useCallback, useRef } from "react";
import { useDnd, type DragKind, type DragPayload, type DragRect } from "./DndContext";

export function useDraggable<K extends DragKind, D extends { id?: unknown }>(payload: {
  kind: K;
  data: D;
}) {
  const { startDrag, state } = useDnd();
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const armedRef = useRef(false);
  const rectRef = useRef<DragRect | null>(null);

  const isDragging =
    state.payload !== null &&
    state.pointer !== null &&
    state.payload.kind === payload.kind &&
    (state.payload.data as { id?: unknown }).id === payload.data.id;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      startRef.current = { x: e.clientX, y: e.clientY };
      armedRef.current = true;
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      rectRef.current = {
        width: r.width,
        height: r.height,
        offsetX: e.clientX - r.left,
        offsetY: e.clientY - r.top,
      };
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
        startDrag(
          payload as unknown as DragPayload,
          { x: e.clientX, y: e.clientY },
          rectRef.current ?? undefined,
        );
      }
    },
    [payload, startDrag],
  );

  const onPointerUp = useCallback(() => {
    armedRef.current = false;
    startRef.current = null;
    rectRef.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, isDragging };
}
