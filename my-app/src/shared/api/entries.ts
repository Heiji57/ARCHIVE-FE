/** 회고 엔트리 도메인 API. */
import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import { request } from "./client";
import { toEntry } from "./mappers";
import type { components } from "./schema";

type EntryResponse = components["schemas"]["EntryResponse"];

export async function apiListEntries(params: {
  retroType?: RetrospectiveType;
  from?: string;
  to?: string;
}): Promise<JournalEntry[]> {
  const list = await request<EntryResponse[] | null | undefined>(
    "/entries",
    { query: params },
  );
  // 서버가 data 를 null/undefined 로 내려보낼 경우 TypeError 방지.
  if (!Array.isArray(list)) {
    console.warn("[entries] GET /entries 응답의 data 가 배열이 아님:", list);
    return [];
  }
  return list.map(toEntry);
}

export async function apiCreateEntry(input: {
  dateKey: string;
  title: string;
  content?: string;
  retroType?: RetrospectiveType;
}): Promise<JournalEntry> {
  const res = await request<EntryResponse>("/entries", {
    method: "POST",
    body: {
      date_key: input.dateKey,
      title: input.title,
      content: input.content ?? "",
      retro_type: input.retroType ?? "daily",
    },
  });
  return toEntry(res);
}

/** Upsert (PUT) — 존재하면 수정, 없으면 생성. */
export async function apiUpsertEntry(
  id: string,
  input: {
    dateKey: string;
    title: string;
    content: string;
    retroType: RetrospectiveType;
  },
): Promise<JournalEntry> {
  const res = await request<EntryResponse>(`/entries/${id}`, {
    method: "PUT",
    body: {
      date_key: input.dateKey,
      title: input.title,
      content: input.content,
      retro_type: input.retroType,
    },
  });
  return toEntry(res);
}

export async function apiGetEntry(id: string): Promise<JournalEntry> {
  const res = await request<EntryResponse>(`/entries/${id}`);
  return toEntry(res);
}

export async function apiDeleteEntry(id: string): Promise<void> {
  await request(`/entries/${id}`, { method: "DELETE" });
}
