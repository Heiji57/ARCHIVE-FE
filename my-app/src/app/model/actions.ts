import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import type {
  GitHubCommit,
  GitHubStatus,
  LinkedRepository,
} from "@/entities/github/model/types";
import type { NotificationItem } from "@/entities/notification/model/types";
import type {
  PendingSummary,
  SummaryKind,
} from "@/entities/summary/model/types";
import type { RetroTemplate } from "@/entities/template";
import type { Todo } from "@/entities/todo/model/types";
import type { User } from "@/entities/user/model/types";
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
  | { type: "todo/upsert"; payload: { todo: Todo } }
  | { type: "todo/remove"; payload: { id: string } }
  // ── 서버 하이드레이션 (API 모드) ──
  | { type: "hydrate/todos"; payload: { todos: Todo[] } }
  | { type: "hydrate/entries"; payload: { entries: JournalEntry[] } }
  | { type: "hydrate/notifications"; payload: { notifications: NotificationItem[] } }
  | { type: "hydrate/settings"; payload: { settings: AppSettings } }
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
  /** POST 응답 서버 ID 로 낙관적 로컬 ID 를 교체한다. */
  | { type: "entry/replaceId"; payload: { localId: string; serverEntry: JournalEntry } }
  /** POST 응답 서버 ID 로 낙관적 로컬 ID 를 교체한다. */
  | { type: "todo/replaceId"; payload: { localId: string; serverTodo: Todo } }
  | { type: "github/setStatus"; payload: { status: GitHubStatus } }
  | {
      type: "github/setLinked";
      payload: {
        status: GitHubStatus;
        repositories: LinkedRepository[];
        login?: string | null;
        pushTargetRepositoryId?: string | null;
      };
    }
  | {
      type: "github/updateLinked";
      payload: { repositoryId: string; commitReadEnabled: boolean };
    }
  | { type: "github/setPushTarget"; payload: { repositoryId: string | null } }
  | { type: "github/setCommits"; payload: { commits: GitHubCommit[] } }
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
  | { type: "summary/setPending"; payload: { pending: PendingSummary | null } }
  | { type: "template/add"; payload: { template: RetroTemplate } }
  | {
      type: "template/update";
      payload: {
        id: string;
        patch: Partial<Pick<RetroTemplate, "name" | "content">>;
      };
    }
  | { type: "template/delete"; payload: { id: string } }
  | {
      type: "template/resetDefault";
      payload: { retroType: RetrospectiveType };
    }
  | {
      type: "template/setActive";
      payload: { retroType: RetrospectiveType; id: string };
    }
  | {
      type: "auth/login";
      payload: { user: User; rememberMe: boolean };
    }
  | { type: "auth/logout" }
  | {
      type: "auth/updateProfile";
      payload: { patch: Partial<Pick<User, "displayName" | "avatarUrl">> };
    }
  | {
      type: "auth/updateUser";
      payload: {
        patch: Partial<Pick<User, "country" | "region" | "timezone">>;
      };
    };
