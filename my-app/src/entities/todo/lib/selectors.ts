import type { Todo } from "@/entities/todo/model/types";

export function findTodoById(todos: Todo[], id: string) {
  return todos.find((todo) => todo.id === id) ?? null;
}
