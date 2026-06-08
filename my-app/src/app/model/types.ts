import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import type {
  AvailableRepository,
  GitHubCommit,
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
  SummaryReadiness,
} from "@/entities/summary/model/types";
import type { Session } from "@/entities/session/model/types";
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
  /** 저장소 commitReadEnabled 토글. */
  updateLinkedRepo: (repositoryId: string, commitReadEnabled: boolean) => void;
  /** 단일 저장소 연결 해제. */
  unlinkGitHubRepo: (repositoryId: string) => void;
  /** 모든 저장소 연결 해제. */
  unlinkAllGitHubRepos: () => void;
  /** 현재 GitHub 저장소를 일괄 연결(sync). */
  syncAllGitHubRepos: () => Promise<void>;
  /** push target 저장소 변경 (null = 해제). */
  setPushTarget: (repositoryId: string | null) => void;
  /** 지정 날짜(생략 시 오늘)의 커밋 목록 조회 — 결과를 직접 반환한다. */
  loadCommits: (date?: string) => Promise<GitHubCommit[]>;
  /** 회고 마크다운을 GitHub push target 저장소에 push. */
  pushRetrospective: (
    retroType: "daily" | "weekly" | "monthly" | "yearly",
    dateKey: string,
    contentMarkdown: string,
  ) => Promise<PushRetrospectiveResult>;
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
  /**
   * monthly/annual 요약 생성 전 데이터 밀도 점검.
   * - weekly·mock·오류 시 null (다이얼로그 없이 바로 생성하면 됨).
   * - entry 추가/수정 전까지 결과를 캐시한다.
   */
  checkSummaryReadiness: (kind: SummaryKind) => Promise<SummaryReadiness | null>;
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
  /** 비밀번호 재설정 메일 발송 (토큰 링크 방식). 보안상 항상 성공으로 간주. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** 이메일 토큰 + 새 비밀번호로 재설정 확정. */
  confirmPasswordReset: (
    token: string,
    newPassword: string,
    newPasswordConfirm: string,
  ) => Promise<ResetPasswordResult>;
  updateProfile: (
    patch: Partial<Pick<User, "displayName" | "avatarUrl">>,
  ) => void;
  // ─── 지역/시간대 (settings) ────────────────────────────────────────────────
  /**
   * 국가 변경.
   * - timezone: 단일 tz 국가는 null/undefined 가능, 다중 tz 는 필수.
   * - keepCurrentTimezone: true 면 API 호출 후 이전 tz 를 복원.
   */
  updateCountry: (
    country: string,
    timezone: string | null,
    keepCurrentTimezone?: boolean,
  ) => Promise<{ ok: boolean }>;
  /**
   * 국가의 IANA timezone 목록 조회 (국가 선택 시 드롭다운 데이터).
   * multi=true 면 사용자가 직접 timezone 을 선택해야 한다.
   */
  loadCountryTimezones: (
    code: string,
  ) => Promise<{ multi: boolean; timezones: string[] }>;
  /** timezone 단독 변경 (국가 유지). AI 요약 실행 시간대 변경용. */
  updateTimezone: (timezone: string) => Promise<{ ok: boolean }>;
  /** GitHub 계정 연결 (로그인 상태에서 OAuth link 팝업). */
  linkGitHubAccount: () => Promise<{ ok: boolean; error?: string }>;
  // ─── 세션 관리 ─────────────────────────────────────────────────────────────
  /** 현재 사용자의 활성 세션(로그인 기기) 목록. */
  listSessions: () => Promise<Session[]>;
  /** 단일 세션 폐기. 현재 세션을 폐기하면 이후 요청이 401 → 로그아웃. */
  revokeSession: (sessionId: string) => Promise<{ ok: boolean }>;
  /** 현재 세션 외 모든 기기 로그아웃. */
  revokeOtherSessions: () => Promise<{ ok: boolean; revokedCount?: number }>;
  // ─── 보안(탈취 감지) ───────────────────────────────────────────────────────
  /** refresh token 재사용 감지로 강제 로그아웃된 상태 (보안 경고 모달 표시용). */
  securityLogout: boolean;
  /** 보안 경고 모달 닫기. */
  dismissSecurityLogout: () => void;
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
  | {
      ok: false;
      error: "token-invalid" | "token-expired" | "not-allowed" | "unknown";
    };

export type PushRetrospectiveResult =
  | { ok: true; commitSha: string; htmlUrl: string; path: string }
  | { ok: false; error: string };
