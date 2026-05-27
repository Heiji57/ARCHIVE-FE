export type RetrospectiveType = "daily" | "weekly" | "monthly" | "yearly";

export interface JournalEntry {
  id: string;
  dateKey: string;
  content: string;
  updatedAt: string;
  title: string;
  synced: boolean;
  retroType: RetrospectiveType;
}
