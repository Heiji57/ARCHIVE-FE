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
