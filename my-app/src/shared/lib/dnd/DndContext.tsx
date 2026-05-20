/**
 * Lightweight, framework-agnostic Drag-and-Drop layer.
 *
 * Goals:
 *  - Mouse + touch via Pointer events (no HTML5 DnD quirks)
 *  - Identifies drops by "kind" + opaque payload, so the same primitive
 *    can be reused for todos→calendar cells, or future surfaces (e.g.
 *    dragging entries, reordering settings rows).
 *  - Surface code only consumes useDraggable / useDropTarget hooks.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type DragKind = string;

export interface DragPayload<K extends DragKind = DragKind> {
  kind: K;
  data: unknown;
}

interface DragState {
  payload: DragPayload | null;
  pointer: { x: number; y: number } | null;
  overTargetId: string | null;
}

interface DropHandler {
  id: string;
  kind: DragKind;
  element: HTMLElement;
  onDrop: (payload: DragPayload) => void;
}

interface DndContextValue {
  state: DragState;
  startDrag: (payload: DragPayload, pointer: { x: number; y: number }) => void;
  endDrag: () => void;
  registerDrop: (handler: DropHandler) => () => void;
}

const DndContext = createContext<DndContextValue | null>(null);

export function DndProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DragState>({
    payload: null,
    pointer: null,
    overTargetId: null,
  });
  const handlersRef = useRef<Map<string, DropHandler>>(new Map());

  const startDrag = useCallback(
    (payload: DragPayload, pointer: { x: number; y: number }) => {
      setState({ payload, pointer, overTargetId: null });
    },
    [],
  );

  const endDrag = useCallback(() => {
    setState({ payload: null, pointer: null, overTargetId: null });
  }, []);

  const registerDrop = useCallback((handler: DropHandler) => {
    handlersRef.current.set(handler.id, handler);
    return () => {
      handlersRef.current.delete(handler.id);
    };
  }, []);

  // Global pointer move/up to track the active drag.
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
      setState({ payload: null, pointer: null, overTargetId: null });
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

export function useDnd() {
  const ctx = useContext(DndContext);
  if (!ctx) throw new Error("useDnd must be used inside DndProvider");
  return ctx;
}
