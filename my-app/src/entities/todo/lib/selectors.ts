import type { Todo } from "@/entities/todo/model/types";
import { fromDateKey, isHiddenAfterDone } from "@/shared/lib/date";

/**
 * 1차: dateKey 오름차순
 * 2차: startTime 오름차순 (없으면 맨 뒤)
 * 3차: title 가나다/ABC 오름차순
 */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.dateKey < b.dateKey) return -1;
    if (a.dateKey > b.dateKey) return 1;
    const ta = a.startTime ?? "￿";
    const tb = b.startTime ?? "￿";
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function findTodoById(todos: Todo[], id: string) {
  return todos.find((todo) => todo.id === id) ?? null;
}

/** 반복 시리즈에 속한 항목인지(가상 인스턴스 또는 예외 row). */
export function isRecurringTodo(todo: Todo): boolean {
  return todo.isVirtual || todo.seriesId !== null;
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
