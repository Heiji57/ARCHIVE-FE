import { createContext, useContext } from "react";

export interface TodoEditorDefaults {
  dateKey: string;
  startTime: string;
  endTime: string;
}

export interface TodoEditorApi {
  /** 할 일 하나를 가운데 모달로 연다. */
  openTodo(id: string): void;
  /** 새 할 일 창을 연다. 날짜와 시간을 미리 채울 수 있다. */
  createTodo(defaults?: Partial<TodoEditorDefaults>): void;
  close(): void;
}

export const TodoEditorCtx = createContext<TodoEditorApi | null>(null);

/**
 * 할 일 편집 창. Task 2 가 할 일 모달(26)과 새 할 일 창(3)으로 구현을 바꿔도 useTodoEditor() 모양은 유지한다.
 * 지금은 기존 TaskDetailPanel 을 가운데 모달에 띄우고, 새 할 일은 제목만 받는 작은 창이다.
 */
export function useTodoEditor(): TodoEditorApi {
  const v = useContext(TodoEditorCtx);
  if (!v) throw new Error("useTodoEditor must be used inside TodoEditorProvider");
  return v;
}

