/** 통합검색(nav 빠른 이동용) 도메인 API. */
import type { JournalEntry } from "@/entities/entry/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { request } from "./client";
import { toEntry, toTodo } from "./mappers";
import type { components } from "./schema";

type GlobalSearchResponse = components["schemas"]["GlobalSearchResponse"];

export interface GlobalSearchResult {
  todos: Todo[];
  entries: JournalEntry[];
}

/**
 * GET /search — Todo + 회고 daily entry 통합검색(nav 빠른 이동용).
 * weekly/monthly/yearly 요약은 포함되지 않는다(entries 는 항상 isSummary=false).
 * 요약까지 포함한 검색은 회고록 목록의 `GET /entries/paginated?q=` 를 쓸 것.
 */
export async function apiGlobalSearch(
  q: string,
  limit?: number,
): Promise<GlobalSearchResult> {
  const res = await request<GlobalSearchResponse>("/search", {
    query: { q, limit },
  });
  return {
    todos: Array.isArray(res?.todos) ? res.todos.map(toTodo) : [],
    entries: Array.isArray(res?.entries) ? res.entries.map(toEntry) : [],
  };
}
