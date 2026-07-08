import { createContext } from "react";

export type DragKind = string;

export interface DragPayload<K extends DragKind = DragKind> {
  kind: K;
  data: unknown;
}

/** 드래그 시작 시 캡처한 원본 요소 치수 + 포인터 오프셋. 고스트 크기·위치 계산에 사용. */
export interface DragRect {
  width: number;
  height: number;
  /** 요소 내 포인터의 상대 X (ghost를 클릭한 위치에 맞춰 정렬하기 위함). */
  offsetX: number;
  offsetY: number;
}

export interface DragState {
  payload: DragPayload | null;
  pointer: { x: number; y: number } | null;
  overTargetId: string | null;
  dragRect: DragRect | null;
}

export interface DropHandler {
  id: string;
  kind: DragKind;
  element: HTMLElement;
  onDrop: (payload: DragPayload) => void;
}

export interface DndContextValue {
  state: DragState;
  startDrag: (
    payload: DragPayload,
    pointer: { x: number; y: number },
    dragRect?: DragRect,
  ) => void;
  endDrag: () => void;
  registerDrop: (handler: DropHandler) => () => void;
}

export const DndContext = createContext<DndContextValue | null>(null);
