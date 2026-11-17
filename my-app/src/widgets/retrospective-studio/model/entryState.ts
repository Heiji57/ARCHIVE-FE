import type { JournalEntry } from "@/entities/entry/model/types";

/** 요약 상태 알약(생성 중, 생성 실패, 작성 중) */
export function useEntryState(entry: JournalEntry) {
  const pending = !!entry.isSummary && (entry.status === "pending" || entry.status === "in_progress");
  const failed = !!entry.isSummary && entry.status === "failed";
  const empty = !entry.isSummary && !entry.content.trim();
  return { pending, failed, empty };
}
