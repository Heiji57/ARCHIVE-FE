/** Todo 도메인 API. 반환은 FE 도메인 타입(camelCase)으로 매핑해 돌려준다. */
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { request } from "./client";
import { toTodo } from "./mappers";
import type { components } from "./schema";

type TodoResponse = components["schemas"]["TodoResponse"];

/** 기간 범위(from~to) 또는 단일 날짜의 할 일 조회 */
export async function apiListTodos(params: {
  from?: string;
  to?: string;
  dateKey?: string;
}): Promise<Todo[]> {
  const list = await request<TodoResponse[]>("/todos", { query: params });
  return list.map(toTodo);
}

export async function apiCreateTodo(input: {
  title: string;
  dateKey: string;
  description?: string;
  status?: TaskStatus;
}): Promise<Todo> {
  const res = await request<TodoResponse>("/todos", {
    method: "POST",
    body: {
      title: input.title,
      date_key: input.dateKey,
      description: input.description ?? "",
      status: input.status ?? "not-start",
    },
  });
  return toTodo(res);
}

export async function apiUpdateTodo(
  id: string,
  patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>,
): Promise<Todo> {
  const body: components["schemas"]["TodoUpdateRequest"] = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.dateKey !== undefined) body.date_key = patch.dateKey;
  const res = await request<TodoResponse>(`/todos/${id}`, {
    method: "PATCH",
    body,
  });
  return toTodo(res);
}

export async function apiDeleteTodo(id: string): Promise<void> {
  await request(`/todos/${id}`, { method: "DELETE" });
}
