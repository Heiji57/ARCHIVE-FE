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
import type {
  NoticeCategory,
  NoticeType,
  NotificationItem,
} from "@/entities/notification/model/types";
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

      const kindLabel =
        kind === "weekly" ? "주간" : kind === "monthly" ? "월간" : "연간";
      pushNotification(
        "success",
        "AI 요약 완료",
        `${kindLabel} 요약이 회고록에 저장되었습니다.`,
        { category: "summary" },
      );
    },
    [state.todos, state.entries, pushNotification],
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

  // ─── Context value ────────────────────────────────────────────────────────
  const value: ArchiveAppContextValue = {
    state,
    addTodo: (title, dateKey = todayKey(), options) => {
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
      dispatch({ type: "todo/update", payload: { id, patch } });
    },
    moveTodo: (id, dateKey) => {
      dispatch({ type: "todo/move", payload: { id, dateKey } });
    },
    updateEntry: (id, patch) => {
      dispatch({ type: "entry/update", payload: { id, patch } });
    },
    saveGitHubConfig: (config) => {
      dispatch({ type: "github/save", payload: { config } });
    },
    pushNotification,
    markNotificationRead: (id) =>
      dispatch({ type: "notification/markRead", payload: { id } }),
    markAllNotificationsRead: () =>
      dispatch({ type: "notification/markAllRead" }),
    clearNotification: (id) =>
      dispatch({ type: "notification/clear", payload: { id } }),
    clearReadNotifications: () => dispatch({ type: "notification/clearRead" }),
    clearAllNotifications: () => dispatch({ type: "notification/clearAll" }),
    dismissNotification,
    setLocale: (locale: Locale) =>
      dispatch({ type: "settings/locale", payload: { locale } }),
    setAutoSummary: (patch: Partial<AppSettings["autoSummary"]>) =>
      dispatch({ type: "settings/autoSummary", payload: { patch } }),
    setNotificationRetention: (days) =>
      dispatch({ type: "settings/retention", payload: { days } }),
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
    // ─── Auth ────────────────────────────────────────────────────────────
    login: async (email, password, rememberMe) => {
      const result = await mockLogin(email, password);
      if (result.ok) {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe },
        });
      }
      return result;
    },
    logout: () => {
      dispatch({ type: "auth/logout" });
    },
    requestEmailCode: (email, mode) => mockRequestEmailCode(email, { mode }),
    verifyEmailCode: (email, code) => mockVerifyEmailCode(email, code),
    completeSignup: async (input: SignupInput) => {
      const result = await mockCompleteSignup(input);
      if (result.ok) {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe: input.rememberMe },
        });
      }
      return result;
    },
    oauthLogin: async (provider: OAuthProvider) => {
      const result = await mockOAuthLogin(provider);
      if (result.ok) {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe: true },
        });
      }
      return result;
    },
    resetPassword: (email, code, newPassword) =>
      mockResetPassword(email, code, newPassword),
    updateProfile: (patch: Partial<Pick<User, "displayName" | "avatarUrl">>) =>
      dispatch({ type: "auth/updateProfile", payload: { patch } }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// re-export for convenience
export type { NoticeCategory };
