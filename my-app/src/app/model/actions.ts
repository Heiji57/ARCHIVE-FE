import type { JournalEntry } from "@/entities/entry/model/types";
import type { GitHubConfig } from "@/entities/github/model/types";
import type { NotificationItem } from "@/entities/notification/model/types";
import type {
  PendingSummary,
  SummaryKind,
} from "@/entities/summary/model/types";
import type { Todo } from "@/entities/todo/model/types";
import type { AppSettings, Locale } from "@/app/model/settings";

export type AppAction =
  | {
      type: "todo/add";
      payload: {
        title: string;
        dateKey: string;
        status?: Todo["status"];
        description?: string;
      };
    }
  | {
      type: "todo/update";
      payload: {
        id: string;
        patch: Partial<
          Pick<Todo, "title" | "status" | "description" | "dateKey">
        >;
      };
    }
  | { type: "todo/move"; payload: { id: string; dateKey: string } }
  | {
      type: "entry/update";
      payload: {
        id: string;
        patch: Partial<
          Pick<JournalEntry, "title" | "content" | "synced" | "retroType">
        >;
      };
    }
  | { type: "entry/upsert"; payload: { entry: JournalEntry } }
  | { type: "github/save"; payload: { config: GitHubConfig | null } }
  | { type: "notification/push"; payload: { notification: NotificationItem } }
  | { type: "notification/dismiss"; payload: { id: string } }
  | { type: "notification/markRead"; payload: { id: string } }
  | { type: "notification/markAllRead" }
  | { type: "notification/clear"; payload: { id: string } }
  | { type: "notification/clearRead" }
  | { type: "notification/clearAll" }
  | { type: "notification/cleanup"; payload: { retentionDays: number } }
  | { type: "settings/locale"; payload: { locale: Locale } }
  | {
      type: "settings/autoSummary";
      payload: { patch: Partial<AppSettings["autoSummary"]> };
    }
  | { type: "settings/retention"; payload: { days: number } }
  | { type: "settings/scheduleCheck"; payload: { timestamp: string } }
  | {
      type: "summary/start";
      payload: { kind: SummaryKind; targetDateKey: string };
    }
  | { type: "summary/minimize" }
  | { type: "summary/complete" }
  | { type: "summary/cancel" }
  | { type: "summary/setPending"; payload: { pending: PendingSummary | null } };
