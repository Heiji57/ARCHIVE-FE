/** 회고 엔트리 도메인 API. */
import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import { request } from "./client";
import { toEntry } from "./mappers";
import type { components } from "./schema";

type EntryResponse = components["schemas"]["EntryResponse"];
type EntryPageResponse = components["schemas"]["EntryPageResponse"];

/**
 * GET /entries — 회고 목록 조회.
 * - `retroType` 만 지정(from/to 없음) → **오늘 기준 최근 30일**만 반환(초기 하이드레이션용).
 * - `from`+`to` 지정 → 해당 기간 전체(최대 366일, 초과 시 422). 날짜는 YYYY-MM-DD.
 * 과거 전체 이력 브라우징은 이 함수가 아니라 apiListEntriesPaginated 를 쓸 것.
 */
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

export interface EntryPage {
  items: JournalEntry[];
  /** 필터(retroType) 매칭 전체 건수 — 총 페이지 수 = Math.ceil(total / size). */
  total: number;
  page: number;
  size: number;
}

/**
 * GET /entries/paginated — 회고록 목록 페이지(과거 전체 이력, 최신순 페이지네이션).
 * `GET /entries`(최근 30일/명시적 기간용)와 용도가 다르니 혼용하지 말 것.
 * - `retroType` 지정 시 daily 는 journal_entries, weekly/monthly/yearly 는
 *   retro_summaries(AI 요약, 소스 테이블이 다름)에서 조회한다.
 * - `retroType` 생략 시 두 소스를 합쳐 최신순("전체" 뷰)으로 반환한다 — 정렬은
 *   daily=date_key, summary=period_start 기준(레코드 생성 시각 아님).
 * - `q` 로 키워드 검색 가능(daily=전문검색, summary=본문 부분일치).
 * - `from`+`to` 둘 다 지정해야 기간 필터가 적용된다(하나만 있으면 서버가 무시).
 *   최대 366일, 초과 시 422. daily 는 date_key 가 범위 안인 것만, weekly/monthly/
 *   yearly 는 요약 기간이 범위와 겹치기만 해도 포함(overlap 기준, 엄격 포함 아님).
 * 서버 오류 시 예외를 그대로 전파한다(호출부가 목록 로드 실패를 표면화하도록).
 */
export async function apiListEntriesPaginated(params: {
  retroType?: RetrospectiveType;
  page?: number;
  size?: number;
  q?: string;
  from?: string;
  to?: string;
}): Promise<EntryPage> {
  const res = await request<EntryPageResponse>("/entries/paginated", {
    query: params,
  });
  const items = Array.isArray(res?.items) ? res.items.map(toEntry) : [];
  return {
    items,
    total: res?.total ?? items.length,
    page: res?.page ?? params.page ?? 1,
    size: res?.size ?? params.size ?? items.length,
  };
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
