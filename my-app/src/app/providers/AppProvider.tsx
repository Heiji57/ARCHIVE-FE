import { useCallback, useEffect, useReducer, useRef, type ReactNode } from "react";
import {
  mockCompleteSignup,
  mockLogin,
  mockOAuthLogin,
  mockRequestEmailCode,
  mockResetPassword,
  mockVerifyEmailCode,
} from "@/app/lib/mockAuth";
import { detectOverdueSchedules } from "@/app/lib/scheduleSummary";
import { buildSummaryEntry, KIND_TO_TYPE } from "@/app/lib/summaryFactory";
import { getInitialAppState } from "@/app/model/initialState";
import { appReducer } from "@/app/model/reducer";
import type { AppSettings, Locale } from "@/app/model/settings";
import type {
  ArchiveAppContextValue,
  PushNotificationOptions,
  SignupInput,
} from "@/app/model/types";
import { AppContext } from "@/app/providers/context";
import { usePersistAppState } from "@/app/providers/usePersistAppState";
import { findEntryByDateKeyAndType } from "@/entities/entry/lib/selectors";
import type { JournalEntry } from "@/entities/entry/model/types";
import type {
  NoticeCategory,
  NoticeType,
  NotificationItem,
} from "@/entities/notification/model/types";
import { resolveActiveTemplate, type RetroTemplate } from "@/entities/template";
import type { OAuthProvider, User } from "@/entities/user/model/types";
import {
  SUMMARY_DURATION_MS,
  type SummaryKind,
} from "@/entities/summary/model/types";
import { getTodosInRange } from "@/entities/todo/lib/selectors";
import { getEntriesInRange } from "@/entities/entry/lib/selectors";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  fromDateKey,
  startOfMonth,
  startOfWeek,
  startOfYear,
  todayKey,
} from "@/shared/lib/date";
import { createId } from "@/shared/lib/id";
import { translate } from "@/shared/lib/i18n";
import {
  USE_API,
  apiClearNotifications,
  apiCompleteSignup,
  apiCreateEntry,
  apiCreateTodo,
  apiDeleteNotification,
  apiGetSettings,
  apiListEntries,
  apiListNotifications,
  apiListTodos,
  apiLogin,
  apiLogout,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiOAuthLogin,
  apiRequestEmailCode,
  apiRestoreSession,
  apiUpdateProfile,
  apiUpdateSettings,
  apiUpdateTodo,
  apiUpsertEntry,
  apiVerifyEmailCode,
} from "@/shared/api";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    getInitialAppState,
  );

  usePersistAppState(state);

  // Track timers so we can clean up.
  const summaryTimerRef = useRef<number | null>(null);

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: "notification/dismiss", payload: { id } });
  }, []);

  const pushNotification = useCallback(
    (
      type: NoticeType,
      title: string,
      message: string,
      options?: PushNotificationOptions,
    ) => {
      const notification: NotificationItem = {
        id: createId("notice"),
        type,
        category: options?.category ?? "general",
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      dispatch({ type: "notification/push", payload: { notification } });
      // Transient toast auto-dismiss handled by ToastViewport, not by store.
    },
    [],
  );

  // ─── Notification retention cleanup ──────────────────────────────────────
  useEffect(() => {
    const interval = window.setInterval(
      () => {
        dispatch({
          type: "notification/cleanup",
          payload: { retentionDays: state.settings.notificationRetentionDays },
        });
      },
      60 * 60 * 1000, // hourly
    );
    return () => window.clearInterval(interval);
  }, [state.settings.notificationRetentionDays]);

  // Run cleanup once on mount.
  useEffect(() => {
    dispatch({
      type: "notification/cleanup",
      payload: { retentionDays: state.settings.notificationRetentionDays },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-summary scheduler ──────────────────────────────────────────────
  // On mount: detect overdue weekly/monthly/yearly boundaries since the last
  // recorded check, and queue them for processing.
  const scheduleRanRef = useRef(false);
  useEffect(() => {
    if (scheduleRanRef.current) return;
    scheduleRanRef.current = true;

    const events = detectOverdueSchedules(
      state.settings.lastScheduleCheckAt,
      state.settings.autoSummary,
    );
    const now = new Date().toISOString();
    dispatch({ type: "settings/scheduleCheck", payload: { timestamp: now } });

    if (events.length === 0) return;

    // Process events sequentially — kick off the first, the rest follow as
    // each completes.
    let i = 0;
    const runNext = () => {
      if (i >= events.length) return;
      const evt = events[i++];
      startSummaryInternal(evt.kind, evt.targetDateKey, runNext);
    };
    runNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Summary lifecycle ────────────────────────────────────────────────────
  const completeSummaryFor = useCallback(
    (kind: SummaryKind, targetDateKey: string) => {
      const target = fromDateKey(targetDateKey);
      let rangeStart: Date;
      let rangeEnd: Date;
      switch (kind) {
        case "weekly":
          rangeStart = startOfWeek(target);
          rangeEnd = endOfWeek(target);
          break;
        case "monthly":
          rangeStart = startOfMonth(target);
          rangeEnd = endOfMonth(target);
          break;
        case "yearly":
          rangeStart = startOfYear(target);
          rangeEnd = endOfYear(target);
          break;
      }

      const todos = getTodosInRange(state.todos, rangeStart, rangeEnd);
      const entries = getEntriesInRange(state.entries, rangeStart, rangeEnd);
      const existing = findEntryByDateKeyAndType(
        state.entries,
        targetDateKey,
        KIND_TO_TYPE[kind],
      );
      const entry = buildSummaryEntry(
        kind,
        targetDateKey,
        todos,
        entries,
        existing,
      );

      dispatch({ type: "entry/upsert", payload: { entry } });
      dispatch({ type: "summary/complete" });

      const locale = state.settings.locale;
      const kindLabel = translate(locale, `summary.kind.${kind}`);
      pushNotification(
        "success",
        translate(locale, "summary.completed.title"),
        translate(locale, "summary.completed.message", { kind: kindLabel }),
        { category: "summary" },
      );
    },
    [state.todos, state.entries, state.settings.locale, pushNotification],
  );

  const startSummaryInternal = useCallback(
    (kind: SummaryKind, targetDateKey: string, onDone?: () => void) => {
      dispatch({
        type: "summary/start",
        payload: { kind, targetDateKey },
      });
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = window.setTimeout(() => {
        completeSummaryFor(kind, targetDateKey);
        onDone?.();
      }, SUMMARY_DURATION_MS);
    },
    [completeSummaryFor],
  );

  // If a pending summary was persisted from a previous session and its
  // willCompleteAt is already past, finish it on mount.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    const p = state.pendingSummary;
    if (!p) return;
    const remaining = new Date(p.willCompleteAt).getTime() - Date.now();
    if (remaining <= 0) {
      completeSummaryFor(p.kind, p.targetDateKey);
    } else {
      summaryTimerRef.current = window.setTimeout(() => {
        completeSummaryFor(p.kind, p.targetDateKey);
      }, remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
    };
  }, []);

  // API 모드: 앱 시작 시 refresh 쿠키로 세션 복원 (access token 은 메모리라 새로고침 시 소실됨).
  const sessionRestoredRef = useRef(false);
  useEffect(() => {
    if (!USE_API || sessionRestoredRef.current) return;
    sessionRestoredRef.current = true;
    void apiRestoreSession().then((user) => {
      if (user) {
        dispatch({ type: "auth/login", payload: { user, rememberMe: true } });
      } else {
        dispatch({ type: "auth/logout" });
      }
    });
  }, []);

  // ─── API 모드: 로그인 후 서버 데이터 하이드레이션 ────────────────────────────
  const hydratedUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (!USE_API) return;
    const uid = state.currentUser?.id ?? null;
    if (!uid || hydratedUserRef.current === uid) return;
    hydratedUserRef.current = uid;

    void apiListTodos({ from: "1970-01-01", to: "2999-12-31" })
      .then((todos) => dispatch({ type: "hydrate/todos", payload: { todos } }))
      .catch(() => {});
    void apiListEntries({})
      .then((entries) =>
        dispatch({ type: "hydrate/entries", payload: { entries } }),
      )
      .catch(() => {});
    void apiGetSettings()
      .then((settings) =>
        dispatch({ type: "hydrate/settings", payload: { settings } }),
      )
      .catch(() => {});
    void apiListNotifications()
      .then((notifications) =>
        dispatch({ type: "hydrate/notifications", payload: { notifications } }),
      )
      .catch(() => {});
  }, [state.currentUser?.id]);

  // ─── API 모드 헬퍼 ──────────────────────────────────────────────────────────
  // 실패 시 일시적 토스트로 알린다 (네트워크 오류 메시지 재사용).
  const reportApiError = () => {
    pushNotification(
      "warning",
      translate(state.settings.locale, "auth.error.network"),
      "",
      { transient: true },
    );
  };
  // 설정은 전체 교체(PUT)이므로 현재 settings 에 patch 를 합쳐 전송.
  const syncSettings = (patch: Partial<AppSettings>) => {
    const next: AppSettings = {
      ...state.settings,
      ...patch,
      autoSummary: { ...state.settings.autoSummary, ...(patch.autoSummary ?? {}) },
    };
    return apiUpdateSettings(next).catch(() => reportApiError());
  };

  // ─── Context value ────────────────────────────────────────────────────────
  const value: ArchiveAppContextValue = {
    state,
    addTodo: (title, dateKey = todayKey(), options) => {
      if (USE_API) {
        // 서버가 id 를 발급하므로 생성은 await 후 dispatch
        void apiCreateTodo({
          title,
          dateKey,
          status: options?.status,
          description: options?.description,
        })
          .then((todo) => dispatch({ type: "todo/upsert", payload: { todo } }))
          .catch(() => reportApiError());
        return;
      }
      dispatch({
        type: "todo/add",
        payload: {
          title,
          dateKey,
          status: options?.status,
          description: options?.description,
        },
      });
    },
    updateTodo: (id, patch) => {
      dispatch({ type: "todo/update", payload: { id, patch } }); // 낙관적
      if (USE_API) void apiUpdateTodo(id, patch).catch(() => reportApiError());
    },
    moveTodo: (id, dateKey) => {
      dispatch({ type: "todo/move", payload: { id, dateKey } }); // 낙관적
      if (USE_API)
        void apiUpdateTodo(id, { dateKey }).catch(() => reportApiError());
    },
    updateEntry: (id, patch) => {
      dispatch({ type: "entry/update", payload: { id, patch } }); // 낙관적
      if (USE_API) {
        const base = state.entries.find((e) => e.id === id);
        if (base) {
          void apiUpsertEntry(id, {
            dateKey: base.dateKey,
            title: patch.title ?? base.title,
            content: patch.content ?? base.content,
            retroType: patch.retroType ?? base.retroType,
          }).catch(() => reportApiError());
        }
      }
    },
    createDailyEntry: (dateKey) => {
      const existing = state.entries.find(
        (e) => e.dateKey === dateKey && e.retroType === "daily",
      );
      if (existing) return { entry: existing, existed: true };
      // 활성 일간 템플릿 내용을 초기 본문으로 채운다
      const template = resolveActiveTemplate(
        state.templates,
        state.activeTemplateIds,
        "daily",
      );
      const entry: JournalEntry = {
        id: createId("entry"),
        dateKey,
        title: `${dateKey} 일일 회고`,
        content: template?.content ?? "",
        retroType: "daily",
        synced: false,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "entry/upsert", payload: { entry } });
      // 서버에도 생성 (id 는 다음 하이드레이션에서 서버 값으로 정렬됨)
      if (USE_API) {
        void apiCreateEntry({
          dateKey,
          title: entry.title,
          content: entry.content,
          retroType: "daily",
        }).catch(() => reportApiError());
      }
      return { entry, existed: false };
    },
    saveGitHubConfig: (config) => {
      // GitHub 연동 엔드포인트는 api.yaml 에 없음 → 항상 로컬 (CLAUDE.md §8)
      dispatch({ type: "github/save", payload: { config } });
    },
    pushNotification,
    markNotificationRead: (id) => {
      dispatch({ type: "notification/markRead", payload: { id } });
      if (USE_API) void apiMarkNotificationRead(id).catch(() => reportApiError());
    },
    markAllNotificationsRead: () => {
      dispatch({ type: "notification/markAllRead" });
      if (USE_API)
        void apiMarkAllNotificationsRead().catch(() => reportApiError());
    },
    clearNotification: (id) => {
      dispatch({ type: "notification/clear", payload: { id } });
      if (USE_API) void apiDeleteNotification(id).catch(() => reportApiError());
    },
    clearReadNotifications: () => {
      dispatch({ type: "notification/clearRead" });
      if (USE_API) void apiClearNotifications(true).catch(() => reportApiError());
    },
    clearAllNotifications: () => {
      dispatch({ type: "notification/clearAll" });
      if (USE_API) void apiClearNotifications(false).catch(() => reportApiError());
    },
    dismissNotification,
    setLocale: (locale: Locale) => {
      dispatch({ type: "settings/locale", payload: { locale } });
      if (USE_API) void syncSettings({ locale });
    },
    setAutoSummary: (patch: Partial<AppSettings["autoSummary"]>) => {
      dispatch({ type: "settings/autoSummary", payload: { patch } });
      if (USE_API)
        void syncSettings({
          autoSummary: { ...state.settings.autoSummary, ...patch },
        });
    },
    setNotificationRetention: (days) => {
      dispatch({ type: "settings/retention", payload: { days } });
      if (USE_API) void syncSettings({ notificationRetentionDays: days });
    },
    startSummary: (kind, targetDateKey) =>
      startSummaryInternal(kind, targetDateKey),
    minimizeSummary: () => dispatch({ type: "summary/minimize" }),
    completeSummary: () => {
      const p = state.pendingSummary;
      if (!p) return;
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
      completeSummaryFor(p.kind, p.targetDateKey);
    },
    cancelSummary: () => {
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
      dispatch({ type: "summary/cancel" });
    },
    // ─── Templates ──────────────────────────────────────────────────────────
    addTemplate: (retroType, name, content) => {
      const template: RetroTemplate = {
        id: createId("template"),
        name,
        retroType,
        content,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "template/add", payload: { template } });
      return template;
    },
    updateTemplate: (id, patch) =>
      dispatch({ type: "template/update", payload: { id, patch } }),
    deleteTemplate: (id) =>
      dispatch({ type: "template/delete", payload: { id } }),
    resetTemplate: (retroType) =>
      dispatch({ type: "template/resetDefault", payload: { retroType } }),
    setActiveTemplate: (retroType, id) =>
      dispatch({ type: "template/setActive", payload: { retroType, id } }),
    // ─── Auth ────────────────────────────────────────────────────────────
    // USE_API 플래그로 실제 API ↔ mock 을 전환한다.
    login: async (email, password, rememberMe) => {
      const result = USE_API
        ? await apiLogin(email, password)
        : await mockLogin(email, password);
      if (result.ok) {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe },
        });
      }
      return result;
    },
    logout: () => {
      if (USE_API) void apiLogout();
      dispatch({ type: "auth/logout" });
    },
    requestEmailCode: (email, mode) =>
      // 회원가입 코드 발송만 API 지원. reset(forgot-password) 흐름은 API 미정의 → mock 폴백.
      USE_API && mode !== "reset"
        ? apiRequestEmailCode(email)
        : mockRequestEmailCode(email, { mode }),
    verifyEmailCode: (email, code) =>
      USE_API ? apiVerifyEmailCode(email, code) : mockVerifyEmailCode(email, code),
    completeSignup: async (input: SignupInput) => {
      const result = USE_API
        ? await apiCompleteSignup(input)
        : await mockCompleteSignup(input);
      if (result.ok) {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe: input.rememberMe },
        });
      }
      return result;
    },
    oauthLogin: async (provider: OAuthProvider) => {
      const result = USE_API
        ? await apiOAuthLogin(provider)
        : await mockOAuthLogin(provider);
      if (result.ok) {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe: true },
        });
      }
      return result;
    },
    // 비밀번호 재설정은 api.yaml 에 없음 → 항상 mock (CLAUDE.md §8).
    resetPassword: (email, code, newPassword) =>
      mockResetPassword(email, code, newPassword),
    updateProfile: (patch: Partial<Pick<User, "displayName" | "avatarUrl">>) => {
      if (USE_API) void apiUpdateProfile(patch);
      dispatch({ type: "auth/updateProfile", payload: { patch } });
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// re-export for convenience
export type { NoticeCategory };
