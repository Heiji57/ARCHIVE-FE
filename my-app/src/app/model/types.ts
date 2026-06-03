import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import type {
  AvailableRepository,
  GitHubState,
} from "@/entities/github/model/types";
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
  notifications: NotificationItem[];
  settings: AppSettings;
  pendingSummary: PendingSummary | null;
  currentUser: User | null;
  rememberMe: boolean;
  templates: RetroTemplate[];
  /** retroType → 새 회고 생성 시 사용할 활성 템플릿 id */
  activeTemplateIds: Record<RetrospectiveType, string>;
}

export interface AppState extends PersistedAppState {
  /** GitHub 연동은 서버 소스(또는 세션) 기반이라 영속화하지 않는다. */
  github: GitHubState;
}

export interface PushNotificationOptions {
  category?: NoticeCategory;
  transient?: boolean;
  /** 선택적 액션 버튼 — 토스트/패널에서 href 로 이동 (예: 데모 "로그인"). */
  actionLabel?: string;
  actionHref?: string;
}

export interface ArchiveAppContextValue {
  state: AppState;
  /** 게스트 데모 모드 여부 (?demo=true). 데모에서는 할 일 외 변경이 차단된다. */
  isDemo: boolean;
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
  // ─── GitHub (서버 저장소 연결 모델) ────────────────────────────────────────
  /** 연결 상태·연결된 저장소 목록을 (재)조회해 상태에 반영. */
  refreshGitHub: () => void;
  /** GitHub 에서 연결 후보(public) 저장소 목록 조회. */
  loadGitHubAvailableRepos: () => Promise<AvailableRepository[]>;
  /** githubRepoId 로 저장소 1개 연결. */
  linkGitHubRepo: (githubRepoId: number) => Promise<void>;
  /** 단일 저장소 연결 해제. */
  unlinkGitHubRepo: (repositoryId: string) => void;
  /** 모든 저장소 연결 해제. */
  unlinkAllGitHubRepos: () => void;
  /** 현재 GitHub 저장소를 일괄 연결(sync). */
  syncAllGitHubRepos: () => Promise<void>;
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
  oauthLogin: (provider: OAuthProvider) => Promise<OAuthResult>;
  /** OAuth 신규 사용자가 국가 입력을 마쳐 가입 완료 (onboarding_token 쿠키 사용). */
  completeOnboarding: (input: {
    country: string;
    region: string | null;
  }) => Promise<SignupResult>;
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
  /** 표시 이름 — API 미저장(클라 전용). */
  displayName: string;
  /** ISO 3166-1 alpha-2 (필수). */
  country: string;
  /** ISO 3166-2 — 다중 tz 국가만 필수, 그 외 null. */
  region: string | null;
  rememberMe: boolean;
}

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; error: "invalid-credentials" | "user-not-found" };

/** OAuth 로그인 결과: 기존 사용자 성공 / 신규 사용자 온보딩 필요 / 실패 */
export type OAuthResult =
  | { kind: "success"; user: User }
  | { kind: "onboarding-required" }
  | { kind: "error"; error: string };

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
