import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  type DndContextValue,
  type DragPayload,
  type DragRect,
  type DragState,
  type DropHandler,
} from "./dndContext";

export function DndProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DragState>({
    payload: null,
    pointer: null,
    overTargetId: null,
    dragRect: null,
  });
  const handlersRef = useRef<Map<string, DropHandler>>(new Map());

  const startDrag = useCallback(
    (
      payload: DragPayload,
      pointer: { x: number; y: number },
      dragRect?: DragRect,
    ) => {
      setState({ payload, pointer, overTargetId: null, dragRect: dragRect ?? null });
    },
    [],
  );

  const endDrag = useCallback(() => {
    setState({ payload: null, pointer: null, overTargetId: null, dragRect: null });
  }, []);

  const registerDrop = useCallback((handler: DropHandler) => {
    handlersRef.current.set(handler.id, handler);
    return () => {
      handlersRef.current.delete(handler.id);
    };
  }, []);

  // 드래그 중 body에 data-dnd-dragging 부여 → CSS hover 억제 선택자에 사용
  useEffect(() => {
    if (state.payload) {
      document.body.dataset.dndDragging = "true";
    } else {
      delete document.body.dataset.dndDragging;
    }
  }, [state.payload]);

  useEffect(() => {
    if (!state.payload) return;

    const onMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      let hitId: string | null = null;
      for (const handler of handlersRef.current.values()) {
        if (handler.kind !== state.payload!.kind) continue;
        const r = handler.element.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          hitId = handler.id;
          break;
        }
      }
      setState((prev) => ({
        ...prev,
        pointer: { x, y },
        overTargetId: hitId,
      }));
    };

    const onUp = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const payload = state.payload!;
      for (const handler of handlersRef.current.values()) {
        if (handler.kind !== payload.kind) continue;
        const r = handler.element.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          handler.onDrop(payload);
          break;
        }
      }
      setState({ payload: null, pointer: null, overTargetId: null, dragRect: null });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [state.payload, endDrag]);

  const value = useMemo<DndContextValue>(
    () => ({ state, startDrag, endDrag, registerDrop }),
    [state, startDrag, endDrag, registerDrop],
  );

  return <DndContext.Provider value={value}>{children}</DndContext.Provider>;
}
