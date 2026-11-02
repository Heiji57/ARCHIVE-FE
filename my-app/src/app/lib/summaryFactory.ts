/**
 * Mock AI summary content factory. Replace with real API later (Gemini / Claude).
 */
import type { Locale } from "@/app/model/settings";
import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import type { SummaryKind } from "@/entities/summary/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { createId } from "@/shared/lib/id";
import { translate } from "@/shared/lib/i18n";

const KIND_TO_TYPE: Record<SummaryKind, RetrospectiveType> = {
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
};

function summaryTitle(kind: SummaryKind, locale: Locale): string {
  return translate(locale, "summary.mock.title", {
    kind: translate(locale, `summary.kind.${kind}`),
  });
}

export function buildSummaryContent(
  kind: SummaryKind,
  todos: Todo[],
  entries: JournalEntry[],
  locale: Locale,
): string {
  const doneCount = todos.filter((t) => t.status === "done").length;
  const inProgressCount = todos.filter((t) => t.status === "in-progress").length;
  const entryCount = entries.length;

  const lines: string[] = [];
  lines.push(`# ${summaryTitle(kind, locale)}`);
  lines.push("");
  lines.push(
    translate(locale, "summary.mock.taskCounts", {
      done: doneCount,
      inProgress: inProgressCount,
    }),
  );
  lines.push(translate(locale, "summary.mock.entryCount", { count: entryCount }));
  lines.push("");
  if (entries.length > 0) {
    lines.push(`## ${translate(locale, "summary.mock.highlights")}`);
    for (const entry of entries.slice(0, 3)) {
      const snippet = entry.content.slice(0, 80).replace(/\n/g, " ");
      lines.push(`- **${entry.title}**: ${snippet}${entry.content.length > 80 ? "…" : ""}`);
    }
  } else {
    lines.push(translate(locale, "summary.mock.empty"));
  }
  return lines.join("\n");
}

export function buildSummaryEntry(
  kind: SummaryKind,
  targetDateKey: string,
  todos: Todo[],
  entries: JournalEntry[],
  existing: JournalEntry | null,
  locale: Locale,
): JournalEntry {
  const content = buildSummaryContent(kind, todos, entries, locale);
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
    title: summaryTitle(kind, locale),
    githubPush: null,
    synced: false,
    retroType: KIND_TO_TYPE[kind],
    folderId: null,
    content,
  };
}

export { KIND_TO_TYPE };
