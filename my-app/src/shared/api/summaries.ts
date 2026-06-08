/**
 * AI 요약 도메인 API (비동기 + SSE).
 *  - POST /summaries/generate → 202 (작업 enqueue)
 *  - GET  /summaries/{id}/stream → SSE 로 완료 신호 수신 (Bearer 인증)
 *
 * ⚠️ EventSource 는 Authorization 헤더를 못 싣는다 → fetch + ReadableStream 으로 직접 파싱.
 */
import type {
  SummaryKind,
  SummaryReadiness,
} from "@/entities/summary/model/types";
import { API_BASE_URL } from "./config";
import { refreshAccessToken, request } from "./client";
import { getAccessToken } from "./tokenStore";
import type { components } from "./schema";

type SummaryResponse = components["schemas"]["SummaryResponse"];
type SummaryContent = components["schemas"]["SummaryContentResponse"];

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

/** 구조화 content → 마크다운 본문 (FE 회고는 마크다운 문자열) */
export function summaryContentToMarkdown(content: SummaryContent | null): string {
  if (!content) return "";
  const section = (title: string, items?: string[]) =>
    items && items.length
      ? `## ${title}\n${items.map((i) => `- ${i}`).join("\n")}`
      : "";
  return [
    section("성과", content.achievements),
    section("어려움", content.challenges),
    section("배운 점", content.learnings),
    section("다음 집중", content.next_focus),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** 요약 생성 요청 (202). periodStart 생략 시 서버가 직전 기간 자동 계산. */
export async function apiGenerateSummary(
  kind: SummaryKind,
): Promise<MappedSummary> {
  const res = await request<SummaryResponse>("/summaries/generate", {
    method: "POST",
    query: { type: KIND_TO_TYPE[kind] },
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

  const dispatchEvent = (evt: StreamEvent) => {
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
    const headers: Record<string, string> = {};
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

  void open(false).catch(() => {
    if (!controller.signal.aborted) handlers.onError?.();
  });

  return () => controller.abort();
}
