import type { JournalEntry } from "@/entities/entry/model/types";
import type { GitHubConfig } from "@/entities/github/model/types";
import type {
  NoticeCategory,
  NoticeType,
  NotificationItem,
} from "@/entities/notification/model/types";
import type {
  PendingSummary,
  SummaryKind,
} from "@/entities/summary/model/types";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import type { AppSettings, Locale } from "@/app/model/settings";

export type AppRoute = "calendar" | "todos" | "retrospectives" | "settings";

export interface PersistedAppState {
  todos: Todo[];
  entries: JournalEntry[];
  githubConfig: GitHubConfig | null;
  notifications: NotificationItem[];
  settings: AppSettings;
  pendingSummary: PendingSummary | null;
}

export type AppState = PersistedAppState;

export interface PushNotificationOptions {
  category?: NoticeCategory;
  transient?: boolean;
}

export interface ArchiveAppContextValue {
  state: AppState;
  addTodo: (
    title: string,
    dateKey?: string,
    options?: { status?: TaskStatus; description?: string },
  ) => void;
  updateTodo: (
    id: string,
    patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>,
  ) => void;
  moveTodo: (id: string, dateKey: string) => void;
  updateEntry: (
    id: string,
    patch: Partial<
      Pick<JournalEntry, "title" | "content" | "synced" | "retroType">
    >,
  ) => void;
  saveGitHubConfig: (config: GitHubConfig | null) => void;
  pushNotification: (
    type: NoticeType,
    title: string,
    message: string,
    options?: PushNotificationOptions,
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  clearReadNotifications: () => void;
  clearAllNotifications: () => void;
  dismissNotification: (id: string) => void;
  setLocale: (locale: Locale) => void;
  setAutoSummary: (patch: Partial<AppSettings["autoSummary"]>) => void;
  setNotificationRetention: (days: number) => void;
  startSummary: (kind: SummaryKind, targetDateKey: string) => void;
  minimizeSummary: () => void;
  completeSummary: () => void;
  cancelSummary: () => void;
}
