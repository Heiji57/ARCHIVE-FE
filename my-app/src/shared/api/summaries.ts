/**
 * AI 요약 도메인 API (비동기 + SSE).
 *  - POST /summaries/generate → 202 (작업 enqueue)
 *  - GET  /summaries/{id}/stream → SSE 로 완료 신호 수신 (Bearer 인증)
 *
 * ⚠️ EventSource 는 Authorization 헤더를 못 싣는다 → fetch + ReadableStream 으로 직접 파싱.
 */
import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import type {
  SummaryKind,
  SummaryReadiness,
} from "@/entities/summary/model/types";
import { formatSummaryTitle } from "@/entities/entry/lib/summaryTitle";
import { API_BASE_URL } from "./config";
import { refreshAccessToken, request } from "./client";
import { getAccessToken } from "./tokenStore";
import type { components } from "./schema";

type SummaryResponse = components["schemas"]["SummaryResponse"];
type SummaryContent = components["schemas"]["SummaryContentResponse"];
type SummaryType = components["schemas"]["SummaryType"];

export interface MappedSummary {
  id: string;
  status: SummaryResponse["status"];
  periodStart: string;
  periodEnd: string;
  content: SummaryContent | null;
}

function toSummary(api: SummaryResponse): MappedSummary {
  return {
    id: api.id,
    status: api.status,
    periodStart: api.period_start,
    periodEnd: api.period_end,
    content: api.content ?? null,
  };
}

// SummaryKind(yearly) ↔ API SummaryType(annual) 매핑
const KIND_TO_TYPE: Record<SummaryKind, "weekly" | "monthly" | "annual"> = {
  weekly: "weekly",
  monthly: "monthly",
  yearly: "annual",
};

// API SummaryType(annual) ↔ FE RetrospectiveType(yearly) 매핑
const TYPE_TO_RETRO: Record<SummaryType, RetrospectiveType> = {
  weekly: "weekly",
  monthly: "monthly",
  annual: "yearly",
};

/**
 * AI 요약(SummaryResponse) → 회고 표시용 JournalEntry.
 * `editedContent`(사용자 편집 오버라이드)가 있으면 그걸 우선 쓰고, 없으면 AI 원본
 * (content.markdown)을 쓴다 — PATCH /summaries/{id} 로 사용자가 직접 편집할 수 있다
 * (AI 원본은 비파괴 보존, contentMarkdown:null 로 편집 해제 시 원본 복귀).
 * dateKey 는 period_start(기간 시작일) — 회고 사이드바의 연/월/주 필터와 정합.
 */
export function toSummaryEntry(api: SummaryResponse): JournalEntry {
  const gp = api.githubPush;
  const githubPush = gp
    ? {
        pushedAt: gp.pushedAt,
        commitSha: gp.commitSha,
        htmlUrl: gp.htmlUrl,
        path: gp.path,
        repositoryFullName: gp.repositoryFullName,
      }
    : null;
  const retroType = TYPE_TO_RETRO[api.summary_type];
  return {
    id: api.id,
    dateKey: api.period_start,
    title: formatSummaryTitle(retroType, api.period_start),
    content: api.editedContent ?? api.content?.markdown ?? "",
    retroType,
    githubPush,
    synced: githubPush !== null,
    updatedAt: api.updated_at ?? api.created_at,
    isSummary: true,
    status: api.status,
    // SummaryResponse 에는 folderId 가 없다(계약 간극) — 신규 entry 기본값(미분류).
    // 이미 아는 entry 를 이 값으로 갱신할 때는 reducer(entry/upsert)가 기존
    // folderId 를 보존한다.
    folderId: null,
  };
}

/** 단일 요약을 회고 표시용 entry 로 조회 (GET /summaries/{id}). */
export async function apiGetSummaryEntry(id: string): Promise<JournalEntry> {
  const res = await request<SummaryResponse>(`/summaries/${id}`);
  return toSummaryEntry(res);
}

/**
 * AI 요약 편집 저장/해제 (PATCH /summaries/{id}).
 * contentMarkdown 이 문자열이면 그 마크다운으로 덮어쓰고, null 이면 편집을 해제해
 * AI 원본(content.markdown)으로 복귀한다(AI 재호출 없음, rate limit 소모 없음).
 */
export async function apiUpdateSummaryContent(
  id: string,
  contentMarkdown: string | null,
): Promise<JournalEntry> {
  const res = await request<SummaryResponse>(`/summaries/${id}`, {
    method: "PATCH",
    body: { contentMarkdown },
  });
  return toSummaryEntry(res);
}

/**
 * 요약 목록 조회 (GET /summaries?type=...).
 * 완료(completed)된 요약만 표시용 entry 로 변환해 반환한다.
 */
export async function apiListSummaries(
  type: SummaryType,
): Promise<JournalEntry[]> {
  const list = await request<SummaryResponse[] | null | undefined>(
    "/summaries",
    { query: { type } },
  );
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => s.status === "completed")
    .map(toSummaryEntry);
}

/**
 * 요약 생성 요청 (202).
 * @param periodStart 요약할 기간의 시작일(YYYY-MM-DD).
 *   - 주간: 해당 주 월요일 / 월간: 해당 달 1일 / 연간: 해당 해 1월 1일
 *   - 생략 시 서버가 직전 기간(지난 주/지난 달/작년) 자동 계산.
 * @param force true 면 이미 completed 인 기간도 강제 재생성(rate limit 소모).
 *   생략/false 면 서버가 기존 완료본을 그대로 반환(재생성 안 함).
 */
export async function apiGenerateSummary(
  kind: SummaryKind,
  periodStart?: string,
  force?: boolean,
): Promise<MappedSummary> {
  const query: Record<string, string | boolean> = {
    type: KIND_TO_TYPE[kind],
  };
  if (periodStart) query.periodStart = periodStart;
  if (force) query.force = true;
  const res = await request<SummaryResponse>("/summaries/generate", {
    method: "POST",
    query,
  });
  return toSummary(res);
}

export async function apiGetSummary(id: string): Promise<MappedSummary> {
  const res = await request<SummaryResponse>(`/summaries/${id}`);
  return toSummary(res);
}

type SummaryReadinessResponse =
  components["schemas"]["SummaryReadinessResponse"];

/**
 * monthly/annual 요약 생성 사전 점검 (GET /summaries/readiness).
 * - periodStart 생략 시 서버가 직전 기간(지난 달/작년) 자동 계산 → generate 와 동일 기간.
 * - weekly 는 미지원(422 RETRO_SUMMARY_READINESS_UNSUPPORTED).
 * 응답 필드는 이미 camelCase 라 그대로 매핑한다.
 */
export async function apiGetSummaryReadiness(
  kind: "monthly" | "yearly",
  periodStart?: string,
): Promise<SummaryReadiness> {
  const type = kind === "yearly" ? "annual" : "monthly";
  const res = await request<SummaryReadinessResponse>("/summaries/readiness", {
    query: periodStart ? { type, periodStart } : { type },
  });
  return {
    summaryType: res.summaryType,
    periodStart: res.periodStart,
    periodEnd: res.periodEnd,
    expectedUnits: res.expectedUnits,
    coveredUnits: res.coveredUnits,
    entryCount: res.entryCount,
    completenessRatio: res.completenessRatio,
    recommendation: res.recommendation,
  };
}

// ─── AI 요약 템플릿 ──────────────────────────────────────────────────────────

type SummaryTemplateResponse = components["schemas"]["SummaryTemplateResponse"];

export interface SummaryTemplate {
  id: string;
  summaryType: SummaryType;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

function toSummaryTemplate(api: SummaryTemplateResponse): SummaryTemplate {
  return {
    id: api.id,
    summaryType: api.summaryType,
    name: api.name,
    content: api.content,
    isActive: api.isActive,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt ?? null,
  };
}

export async function apiListSummaryTemplates(type: SummaryType): Promise<SummaryTemplate[]> {
  const list = await request<SummaryTemplateResponse[] | null | undefined>(
    "/summaries/templates",
    { query: { type } },
  );
  if (!Array.isArray(list)) return [];
  return list.map(toSummaryTemplate);
}

export async function apiCreateSummaryTemplate(
  type: SummaryType,
  name: string,
  content: string,
): Promise<SummaryTemplate> {
  const res = await request<SummaryTemplateResponse>("/summaries/templates", {
    method: "POST",
    query: { type },
    body: { name, content },
  });
  return toSummaryTemplate(res);
}

export async function apiUpdateSummaryTemplate(
  id: string,
  patch: { name?: string; content?: string },
): Promise<SummaryTemplate> {
  const res = await request<SummaryTemplateResponse>(`/summaries/templates/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return toSummaryTemplate(res);
}

export async function apiDeleteSummaryTemplate(id: string): Promise<void> {
  await request(`/summaries/templates/${id}`, { method: "DELETE" });
}

/** type별 활성 AI 요약 템플릿 설정 (null = 해제). */
export async function apiSetActiveSummaryTemplate(
  type: SummaryType,
  templateId: string | null,
): Promise<void> {
  await request("/settings/auto-summary/active", {
    method: "PUT",
    body: { [type]: templateId },
  });
}

// ─── SSE 스트림 ───────────────────────────────────────────────────────────────

export interface SummaryStreamHandlers {
  onCompleted: () => void;
  onFailed?: () => void;
  onTimeout?: () => void;
  onError?: () => void;
}

interface StreamEvent {
  status?: "completed" | "failed" | "timeout" | "error";
}

/**
 * 요약 완료 SSE 구독. 반환된 함수를 호출하면 구독을 중단한다.
 * 401 이면 refresh 1회 후 재시도.
 */
export function streamSummary(
  id: string,
  handlers: SummaryStreamHandlers,
): () => void {
  const controller = new AbortController();
  // 서버가 terminal 이벤트(completed/failed/timeout)를 보냈는지 추적.
  // 스트림이 이벤트 없이 닫히면(서버 타임아웃·네트워크 끊김) onTimeout 을 폴백으로 호출한다.
  let terminalDispatched = false;

  const dispatchEvent = (evt: StreamEvent) => {
    terminalDispatched = true;
    switch (evt.status) {
      case "completed":
        handlers.onCompleted();
        break;
      case "failed":
        handlers.onFailed?.();
        break;
      case "timeout":
        handlers.onTimeout?.();
        break;
      default:
        handlers.onError?.();
    }
  };

  const open = async (retried: boolean): Promise<void> => {
    const headers: Record<string, string> = {
      // 프록시·백엔드의 gzip 압축을 막아 SSE 청크가 실시간으로 전달되게 한다.
      "Accept-Encoding": "identity",
    };
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/summaries/${id}/stream`, {
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    if (res.status === 401 && !retried) {
      const ok = await refreshAccessToken();
      if (ok) return open(true);
    }
    if (!res.ok || !res.body) {
      handlers.onError?.();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const dataLine = chunk
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        try {
          dispatchEvent(JSON.parse(dataLine.slice(5).trim()) as StreamEvent);
        } catch {
          /* malformed event 무시 */
        }
      }
    }
  };

  void open(false)
    .then(() => {
      // 스트림이 정상 종료됐지만 terminal 이벤트 미수신 → 서버 타임아웃으로 간주
      if (!controller.signal.aborted && !terminalDispatched) {
        handlers.onTimeout?.();
      }
    })
    .catch(() => {
      if (!controller.signal.aborted && !terminalDispatched) {
        handlers.onError?.();
      }
    });

  return () => controller.abort();
}
