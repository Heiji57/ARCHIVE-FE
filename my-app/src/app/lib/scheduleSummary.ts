/**
 * Pure logic to determine which auto-summary periods have "ended" since the
 * last schedule check. The provider effect runs this on mount and dispatches
 * one summary/start per detected boundary.
 */
import type { SummaryKind } from "@/entities/summary/model/types";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  toDateKey,
} from "@/shared/lib/date";

export interface ScheduleEvent {
  kind: SummaryKind;
  targetDateKey: string;
  /** ISO timestamp of the boundary that triggered this. */
  boundaryAt: string;
}

export function detectOverdueSchedules(
  lastCheckIso: string | null,
  enabled: { weekly: boolean; monthly: boolean; yearly: boolean },
  now = new Date(),
): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  const last = lastCheckIso ? new Date(lastCheckIso) : null;

  // Helper: was the boundary date crossed since last check?
  const crossed = (boundary: Date) => {
    if (boundary.getTime() > now.getTime()) return false; // future
    if (!last) return true; // no prior record -> treat as crossed
    return boundary.getTime() > last.getTime();
  };

  // Weekly: end of last completed week (Sunday end -> Monday boundary at 00:00)
  if (enabled.weekly) {
    // Use the most recent Sunday <= now
    const ref = new Date(now);
    const sun = endOfWeek(ref); // Saturday actually — we want Sunday
    // endOfWeek returns Saturday (since startOfWeek treats Sunday as first day).
    // We want the Sunday at 23:59 boundary.
    const sunday = new Date(
      sun.getFullYear(),
      sun.getMonth(),
      sun.getDate() + 1,
      0,
      0,
      0,
    );
    if (crossed(sunday)) {
      events.push({
        kind: "weekly",
        targetDateKey: toDateKey(
          new Date(sunday.getTime() - 24 * 60 * 60 * 1000),
        ),
        boundaryAt: sunday.toISOString(),
      });
    }
  }

  // Monthly: midnight after the last day of the previous month
  if (enabled.monthly) {
    const lastMonthEnd = endOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 15),
    );
    const boundary = new Date(
      lastMonthEnd.getFullYear(),
      lastMonthEnd.getMonth() + 1,
      1,
      0,
      0,
      0,
    );
    if (crossed(boundary)) {
      events.push({
        kind: "monthly",
        targetDateKey: toDateKey(lastMonthEnd),
        boundaryAt: boundary.toISOString(),
      });
    }
  }

  // Yearly: midnight Jan 1 after the last completed year
  if (enabled.yearly) {
    const lastYearEnd = endOfYear(
      new Date(now.getFullYear() - 1, 6, 15),
    );
    const boundary = new Date(lastYearEnd.getFullYear() + 1, 0, 1, 0, 0, 0);
    if (crossed(boundary)) {
      events.push({
        kind: "yearly",
        targetDateKey: toDateKey(lastYearEnd),
        boundaryAt: boundary.toISOString(),
      });
    }
  }

  return events;
}
