import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";

export function getEntriesByRetroType(
  entries: JournalEntry[],
  retroType: RetrospectiveType,
) {
  return entries.filter((entry) => entry.retroType === retroType);
}
