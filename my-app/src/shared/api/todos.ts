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
  /** UTC ISO datetime (localTimeToUtcISO 변환 후 전달) */
  startTimeUtc?: string | null;
  endTimeUtc?: string | null;
  /** start_time/end_time 중 하나라도 있으면 필수 (api.yaml TodoCreateRequest) */
  timezone?: string | null;
}): Promise<Todo> {
  const hasTime = input.startTimeUtc != null || input.endTimeUtc != null;
  const res = await request<TodoResponse>("/todos", {
    method: "POST",
    body: {
      title: input.title,
      date_key: input.dateKey,
      description: input.description ?? "",
      status: input.status ?? "not-start",
      ...(input.startTimeUtc !== undefined && { start_time: input.startTimeUtc }),
      ...(input.endTimeUtc !== undefined && { end_time: input.endTimeUtc }),
      ...(hasTime && { timezone: input.timezone ?? null }),
    },
  });
  return toTodo(res);
}

/**
 * Todo 부분 수정. 시간 필드는 UTC ISO datetime + IANA timezone 으로 전송한다
 * (api.yaml TodoUpdateRequest: omit=unchanged, null=clear, string=set).
 */
export async function apiUpdateTodo(
  id: string,
  patch: Partial<
    Pick<Todo, "title" | "status" | "description" | "dateKey">
  > & {
    /** UTC ISO datetime 또는 null(clear). omit 시 미변경. */
    startTime?: string | null;
    endTime?: string | null;
    /** start/end 중 하나라도 non-null 로 설정 시 필수. */
    timezone?: string | null;
  },
): Promise<Todo> {
  const body: components["schemas"]["TodoUpdateRequest"] = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.dateKey !== undefined) body.date_key = patch.dateKey;
  if (patch.startTime !== undefined) body.start_time = patch.startTime;
  if (patch.endTime !== undefined) body.end_time = patch.endTime;
  if (patch.timezone !== undefined) body.timezone = patch.timezone;
  const res = await request<TodoResponse>(`/todos/${id}`, {
    method: "PATCH",
    body,
  });
  return toTodo(res);
}

export async function apiDeleteTodo(id: string): Promise<void> {
  await request(`/todos/${id}`, { method: "DELETE" });
}
