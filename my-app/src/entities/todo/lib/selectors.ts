import type { Todo } from "@/entities/todo/model/types";
import { fromDateKey, isHiddenAfterDone } from "@/shared/lib/date";

export function findTodoById(todos: Todo[], id: string) {
  return todos.find((todo) => todo.id === id) ?? null;
}

/** Filter todos that should appear on the Todo Board (hide done >24h). */
export function getVisibleBoardTodos(todos: Todo[], now = Date.now()) {
  return todos.filter(
    (todo) => !(todo.status === "done" && isHiddenAfterDone(todo.completedAt, now)),
  );
}

/** Filter todos by a specific date key. */
export function getTodosByDateKey(todos: Todo[], dateKey: string) {
  return todos.filter((todo) => todo.dateKey === dateKey);
}

/** Filter todos within an inclusive date range. */
export function getTodosInRange(todos: Todo[], start: Date, end: Date) {
  const s = start.getTime();
  const e = end.getTime();
  return todos.filter((todo) => {
    const t = fromDateKey(todo.dateKey).getTime();
    return t >= s && t <= e;
  });
}
