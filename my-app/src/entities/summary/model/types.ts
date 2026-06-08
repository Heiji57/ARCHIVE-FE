export type SummaryKind = "weekly" | "monthly" | "yearly";

export interface PendingSummary {
  id: string;
  kind: SummaryKind;
  startedAt: string;
  willCompleteAt: string;
  minimized: boolean;
  targetDateKey: string;
}

export const SUMMARY_DURATION_MS = 6000;

/**
 * monthly/annual 요약 생성 전 데이터 밀도 사전 점검 결과
 * (GET /summaries/readiness). 응답 필드는 camelCase 그대로.
 */
export interface SummaryReadiness {
  summaryType: "monthly" | "annual";
  periodStart: string;
  periodEnd: string;
  /** monthly = 그 달의 일수, annual = 12 */
  expectedUnits: number;
  /** monthly = entry 있는 날짜 수, annual = entry 있는 월 수 */
  coveredUnits: number;
  entryCount: number;
  /** coveredUnits / expectedUnits (0~1) */
  completenessRatio: number;
  /** "ok" (≥0.7) | "insufficient" (<0.7) */
  recommendation: "ok" | "insufficient";
}
