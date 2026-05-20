import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import { fromDateKey } from "@/shared/lib/date";

export function getEntriesByRetroType(
  entries: JournalEntry[],
  retroType: RetrospectiveType,
) {
  return entries.filter((entry) => entry.retroType === retroType);
}

export function getEntriesInRange(
  entries: JournalEntry[],
  start: Date,
  end: Date,
) {
  const s = start.getTime();
  const e = end.getTime();
  return entries.filter((entry) => {
    const t = fromDateKey(entry.dateKey).getTime();
    return t >= s && t <= e;
  });
}

export function findEntryByDateKeyAndType(
  entries: JournalEntry[],
  dateKey: string,
  retroType: RetrospectiveType,
) {
  return (
    entries.find(
      (entry) => entry.dateKey === dateKey && entry.retroType === retroType,
    ) ?? null
  );
}
