import { useCallback } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { Todo } from "@/entities/todo/model/types";
import { useTodoEditor } from "@/widgets/todo-editor";
import { useCalendarDrag, type TodoChange } from "./useCalendarDrag";

/**
 * 할 일 끌어 놓기(캘린더, 할 일 보드, 오른쪽 패널이 같이 씀). 놓을 곳은 DOM 속성(data-lane, data-adg,
 * data-drop)으로 찾으므로 화면 사이로도 놓인다(보드 카드 → 패널 시간표). 움직이지 않고 떼면 할 일 창,
 * 빈 시간 칸을 누르거나 끌면 새 할 일 창.
 */
export function useTodoDrag() {
  const { moveTodo, updateTodo, setTodoTime } = useArchiveApp();
  const editor = useTodoEditor();
  const commit = useCallback(
    (c: TodoChange, a: Todo) => {
      const dueChanged = (a.dueDate ?? null) !== c.dueDate;
      if (dueChanged) updateTodo(a.id, { dateKey: c.dateKey, dueDate: c.dueDate });
      else if (c.dateKey !== a.dateKey) moveTodo(a.id, c.dateKey);
      if ((a.startTime ?? null) !== c.startTime || (a.endTime ?? null) !== c.endTime) setTodoTime(a.id, c.startTime, c.endTime);
    },
    [updateTodo, moveTodo, setTodoTime],
  );
  return useCalendarDrag({
    onCommit: commit,
    onOpen: editor.openTodo,
    onCreate: (r) => editor.createTodo(r),
  });
}
