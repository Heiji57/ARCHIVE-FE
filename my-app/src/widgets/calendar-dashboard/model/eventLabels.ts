import type { TaskStatus } from "@/entities/todo/model/types";
import type { TranslationKey } from "@/shared/lib/i18n";
import type { DueInfo } from "./eventInfo";

/** 상태 색(--tc). 시안 P.STC: 진행 전 회색, 진행 중 보라, 완료 초록. */
export const STATUS_COLOR: Record<TaskStatus, string> = {
  "not-start": "var(--ink3)",
  "in-progress": "var(--primary)",
  done: "var(--done)",
};

export const STATUS_KEY: Record<TaskStatus, TranslationKey> = {
  "not-start": "cal.status.notStart",
  "in-progress": "cal.status.inProgress",
  done: "cal.status.done",
};

export function dueText(t: (k: TranslationKey, v?: Record<string, string | number>) => string, d: DueInfo): string {
  if (d.kind === "done") return t("cal.due.done");
  if (d.kind === "today") return t("cal.due.today");
  if (d.kind === "late") return t("cal.due.late", { n: d.days });
  return t("cal.due.left", { n: d.days });
}

