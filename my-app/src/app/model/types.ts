import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
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
import type { RetroTemplate } from "@/entities/template";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import type { OAuthProvider, User } from "@/entities/user/model/types";
import type { AppSettings, Locale } from "@/app/model/settings";

export type AppRoute = "calendar" | "todos" | "retrospectives" | "settings";

export interface PersistedAppState {
  todos: Todo[];
  entries: JournalEntry[];
  githubConfig: GitHubConfig | null;
  notifications: NotificationItem[];
  settings: AppSettings;
  pendingSummary: PendingSummary | null;
  currentUser: User | null;
  rememberMe: boolean;
  templates: RetroTemplate[];
  /** retroType → 새 회고 생성 시 사용할 활성 템플릿 id */
  activeTemplateIds: Record<RetrospectiveType, string>;
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
  createDailyEntry: (dateKey: string) => { entry: JournalEntry; existed: boolean };
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
  // ─── Templates ──────────────────────────────────────────────────────────
  addTemplate: (
    retroType: RetrospectiveType,
    name: string,
    content: string,
  ) => RetroTemplate;
  updateTemplate: (
    id: string,
    patch: Partial<Pick<RetroTemplate, "name" | "content">>,
  ) => void;
  deleteTemplate: (id: string) => void;
  resetTemplate: (retroType: RetrospectiveType) => void;
  setActiveTemplate: (retroType: RetrospectiveType, id: string) => void;
  // ─── Auth ────────────────────────────────────────────────────────────────
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<LoginResult>;
  logout: () => void;
  requestEmailCode: (
    email: string,
    mode?: "signup" | "reset",
  ) => Promise<RequestCodeResult>;
  verifyEmailCode: (email: string, code: string) => Promise<VerifyCodeResult>;
  completeSignup: (input: SignupInput) => Promise<SignupResult>;
  oauthLogin: (provider: OAuthProvider) => Promise<LoginResult>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<ResetPasswordResult>;
  updateProfile: (
    patch: Partial<Pick<User, "displayName" | "avatarUrl">>,
  ) => void;
}

// ─── Auth result types ──────────────────────────────────────────────────────

export interface SignupInput {
  email: string;
  password: string;
  displayName: string;
  rememberMe: boolean;
}

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; error: "invalid-credentials" | "user-not-found" };

export type RequestCodeResult =
  | { ok: true }
  | { ok: false; error: "already-registered" | "cooldown" };

export type VerifyCodeResult =
  | { ok: true }
  | { ok: false; error: "invalid-code" | "expired" | "not-requested" };

export type SignupResult =
  | { ok: true; user: User }
  | { ok: false; error: "email-not-verified" | "already-registered" };

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: "invalid-code" | "user-not-found" };
