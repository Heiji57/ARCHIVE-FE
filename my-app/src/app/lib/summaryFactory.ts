/**
 * Mock AI summary content factory. Replace with real API later (Gemini / Claude).
 */
import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import type { SummaryKind } from "@/entities/summary/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { createId } from "@/shared/lib/id";

const KIND_TO_TYPE: Record<SummaryKind, RetrospectiveType> = {
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
};

const TITLE_BY_KIND: Record<SummaryKind, string> = {
  weekly: "AI 주간 요약",
  monthly: "AI 월간 요약",
  yearly: "AI 연간 요약",
};

export function buildSummaryContent(
  kind: SummaryKind,
  todos: Todo[],
  entries: JournalEntry[],
): string {
  const doneCount = todos.filter((t) => t.status === "done").length;
  const inProgressCount = todos.filter((t) => t.status === "in-progress").length;
  const entryCount = entries.length;

  const lines: string[] = [];
  lines.push(`# ${TITLE_BY_KIND[kind]}`);
  lines.push("");
  lines.push(`완료한 작업: ${doneCount}건 · 진행 중: ${inProgressCount}건`);
  lines.push(`작성한 회고록: ${entryCount}건`);
  lines.push("");
  if (entries.length > 0) {
    lines.push("## 주요 메모");
    for (const entry of entries.slice(0, 3)) {
      const snippet = entry.content.slice(0, 80).replace(/\n/g, " ");
      lines.push(`- **${entry.title}**: ${snippet}${entry.content.length > 80 ? "…" : ""}`);
    }
  } else {
    lines.push("이 기간에 작성된 회고록이 없습니다.");
  }
  return lines.join("\n");
}

export function buildSummaryEntry(
  kind: SummaryKind,
  targetDateKey: string,
  todos: Todo[],
  entries: JournalEntry[],
  existing: JournalEntry | null,
): JournalEntry {
  const content = buildSummaryContent(kind, todos, entries);
  const now = new Date().toISOString();
  if (existing) {
    return {
      ...existing,
      content: existing.content
        ? `${existing.content}\n\n---\n\n${content}`
        : content,
      updatedAt: now,
    };
  }
  return {
    id: createId("entry"),
    dateKey: targetDateKey,
    updatedAt: now,
    title: TITLE_BY_KIND[kind],
    synced: false,
    retroType: KIND_TO_TYPE[kind],
    content,
  };
}

export { KIND_TO_TYPE, TITLE_BY_KIND };
