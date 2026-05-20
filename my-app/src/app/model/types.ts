import type { JournalEntry } from "@/entities/entry/model/types";
import type { GitHubConfig } from "@/entities/github/model/types";
import type {
  NoticeType,
  NotificationItem,
} from "@/entities/notification/model/types";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";

export type AppRoute = "calendar" | "todos" | "retrospectives" | "settings";

export interface PersistedAppState {
  todos: Todo[];
  entries: JournalEntry[];
  githubConfig: GitHubConfig | null;
}

export interface AppState extends PersistedAppState {
  notifications: NotificationItem[];
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
  updateEntry: (
    id: string,
    patch: Partial<Pick<JournalEntry, "title" | "content" | "synced" | "retroType">>,
  ) => void;
  saveGitHubConfig: (config: GitHubConfig | null) => void;
  pushNotification: (
    type: NoticeType,
    title: string,
    message: string,
  ) => void;
  dismissNotification: (id: string) => void;
}
