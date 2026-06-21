import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  mockCompleteOnboarding,
  mockCompleteSignup,
  mockConfirmPasswordReset,
  mockLogin,
  mockOAuthLogin,
  mockRequestEmailCode,
  mockRequestPasswordReset,
  mockVerifyEmailCode,
} from "@/app/lib/mockAuth";
import { detectOverdueSchedules } from "@/app/lib/scheduleSummary";
import {
  buildSummaryEntry,
  KIND_TO_TYPE,
  TITLE_BY_KIND,
} from "@/app/lib/summaryFactory";
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
  type SummaryReadiness,
} from "@/entities/summary/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { getTodosInRange, sortTodos } from "@/entities/todo/lib/selectors";
import { getEntriesInRange } from "@/entities/entry/lib/selectors";
import { DEMO_ANCHOR_DATE_KEY, isDemoMode } from "@/app/config/demo";
import {
  computeAutoTodoTime,
  endOfMonth,
  endOfWeek,
  endOfYear,
  fromDateKey,
  localTimeToUtcISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  todayKeyInTz,
} from "@/shared/lib/date";
import { createCoalescingQueue } from "@/shared/lib/coalesce";
import { createId } from "@/shared/lib/id";
import { translate } from "@/shared/lib/i18n";
import { ConfirmModal } from "@/shared/ui";
import {
  USE_API,
  ApiError,
  apiClearNotifications,
  apiCompleteOnboarding,
  apiCompleteSignup,
  apiCreateEntry,
  apiCreateTodo,
  apiDeleteNotification,
  apiGenerateSummary,
  apiGetConnection,
  apiGetCommits,
  apiGetSettings,
  apiGetSummary,
  apiGetSummaryReadiness,
  apiLinkOAuth,
  apiLinkRepo,
  apiConfirmPasswordReset,
  apiRequestPasswordReset,
  apiGetCountryTimezones,
  apiUpdateCountry,
  apiUpdateTimezone,
  apiListAvailableRepos,
  apiGetEntry,
  apiListEntries,
  apiListLinkedRepos,
  apiListNotifications,
  apiListSessions,
  apiListTodos,
  apiLogin,
  apiLogout,
  apiRevokeSession,
  apiRevokeOtherSessions,
  setSessionInvalidatedHandler,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiOAuthLogin,
  apiPushRetrospective,
  apiRequestEmailCode,
  apiRestoreSession,
  apiSetPushTarget,
  apiSyncAllRepos,
  apiUnlinkAllRepos,
  apiUnlinkRepo,
  apiUpdateProfile,
  apiUpdateRepo,
  apiUpdateSettings,
  apiUpdateTemplate,
  apiUpdateTodo,
  apiUpsertEntry,
  apiVerifyEmailCode,
  apiListTemplates,
  apiCreateTemplate,
  apiDeleteTemplate,
  apiResetTemplate,
  apiSetActiveTemplate,
  streamNotifications,
  streamSummary,
  summaryContentToMarkdown,
} from "@/shared/api";
import {
  MOCK_AVAILABLE_REPOS,
  MOCK_COMMITS,
  MOCK_LOGIN,
  mockLinkRepository,
} from "@/app/lib/mockGithub";
import { toPeriodKey } from "@/shared/lib/date";
import {
  countryDefaultTimezone,
  MULTI_TZ_COUNTRIES,
  supportedTimeZones,
  type MultiTzCountry,
} from "@/shared/lib/geo";
import type { AvailableRepository } from "@/entities/github/model/types";
import {
  mockListSessions,
  mockRevokeSession,
  mockRevokeOtherSessions,
} from "@/app/lib/mockAuth";
import type { PushRetrospectiveResult } from "@/app/model/types";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    getInitialAppState,
  );

  usePersistAppState(state);

  // Track timers so we can clean up.
  const summaryTimerRef = useRef<number | null>(null);

  // 탈취 감지(refresh token 재사용) → 강제 로그아웃 + 보안 경고 모달 플래그
  const [securityLogout, setSecurityLogout] = useState(false);

  // client 레이어가 AUTH_REFRESH_TOKEN_REUSE_DETECTED 를 받으면 여기로 통지된다.
  // 자동 refresh 재시도 없이 즉시 로그아웃 + 보안 모달을 띄운다.
  useEffect(() => {
    setSessionInvalidatedHandler(() => {
      dispatch({ type: "auth/logout" });
      setSecurityLogout(true);
    });
    return () => setSessionInvalidatedHandler(null);
  }, []);

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
        actionLabel: options?.actionLabel,
        actionHref: options?.actionHref,
        transient: options?.transient,
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

  // ─── API 모드: SSE 기반 비동기 요약 ─────────────────────────────────────────
  const apiSummaryAbortRef = useRef<(() => void) | null>(null);
  // readiness 점검 결과 캐시 ("kind:periodStart" 별). entry 추가/수정 시 무효화한다.
  const readinessCacheRef = useRef<Map<string, SummaryReadiness>>(new Map());

  const finalizeApiSummary = (
    summaryId: string,
    kind: SummaryKind,
    targetDateKey: string,
  ) => {
    void apiGetSummary(summaryId)
      .then((summary) => {
        const entryDateKey = summary.periodEnd || targetDateKey;
        const retroType = KIND_TO_TYPE[kind];
        // 이미 로컬에 같은 기간·종류의 entry 가 있으면(하이드레이션/이전 요약) 그
        // id 를 재사용해 낙관적 단계에서 중복 entry 가 생기지 않게 한다.
        const existingLocal = state.entries.find(
          (e) => e.retroType === retroType && e.dateKey === entryDateKey,
        );
        const localId = existingLocal?.id ?? createId("entry");
        const entry: JournalEntry = {
          id: localId,
          dateKey: entryDateKey,
          title: TITLE_BY_KIND[kind],
          content: summaryContentToMarkdown(summary.content),
          retroType,
          githubPush: null,
          synced: false,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: "entry/upsert", payload: { entry } });
        dispatch({ type: "summary/complete" });
        const locale = state.settings.locale;
        pushNotification(
          "success",
          translate(locale, "summary.completed.title"),
          translate(locale, "summary.completed.message", {
            kind: translate(locale, `summary.kind.${kind}`),
          }),
          { category: "summary" },
        );
        // API 모드: 생성된 entry 를 서버에 영속화한다.
        // 저장하지 않으면 새로고침 시 주간/월간/연간 회고록이 사라진다.
        void persistSummaryEntry(
          localId,
          kind,
          entryDateKey,
          summary.periodStart,
          summary.periodEnd || entryDateKey,
          entry.title,
          entry.content,
        );
      })
      .catch(() => dispatch({ type: "summary/cancel" }));
  };

  /**
   * 요약으로 생성된 회고록 entry 를 서버에 영속화한다.
   *  1. POST /entries 시도 → 성공 시 서버 ID 로 로컬 임시 ID 교체.
   *  2. 409 JOURNAL_ENTRY_ALREADY_EXISTS → 서버에 이미 존재 →
   *     GET /entries 로 해당 기간 기존 entry 의 ID 를 찾아 PUT 으로 덮어쓴다.
   *
   * (덮어쓸지 여부는 생성 전 사용자 확인을 이미 거쳤다 — 여기서는 그대로 저장.)
   */
  const persistSummaryEntry = async (
    localId: string,
    kind: SummaryKind,
    entryDateKey: string,
    periodStart: string,
    periodEnd: string,
    title: string,
    content: string,
  ) => {
    const retroType = KIND_TO_TYPE[kind];
    try {
      const serverEntry = await apiCreateEntry({
        dateKey: entryDateKey,
        title,
        content,
        retroType,
      });
      dispatch({ type: "entry/replaceId", payload: { localId, serverEntry } });
    } catch (e) {
      if (
        !(e instanceof ApiError) ||
        e.code !== "JOURNAL_ENTRY_ALREADY_EXISTS"
      ) {
        console.warn("[persistSummaryEntry] entry 생성 실패:", e);
        return;
      }
      // 이미 존재 → 기존 entry 를 찾아 덮어쓴다.
      try {
        const existingList = await apiListEntries({
          retroType,
          from: periodStart,
          to: periodEnd,
        });
        const existing = existingList[0];
        if (!existing) {
          console.warn(
            "[persistSummaryEntry] 409 이지만 기존 entry 조회 실패 — 건너뜀",
          );
          return;
        }
        const updated = await apiUpsertEntry(existing.id, {
          dateKey: existing.dateKey,
          title,
          content,
          retroType,
        });
        // 로컬 임시 entry 를 서버의 기존 entry(덮어쓴 내용)로 교체한다.
        dispatch({
          type: "entry/replaceId",
          payload: { localId, serverEntry: updated },
        });
      } catch (inner) {
        console.warn("[persistSummaryEntry] 덮어쓰기 실패:", inner);
      }
    }
  };

  const startSummaryViaApi = (
    kind: SummaryKind,
    targetDateKey: string,
    periodStart?: string,
  ) => {
    dispatch({ type: "summary/start", payload: { kind, targetDateKey } });
    apiSummaryAbortRef.current?.();
    apiSummaryAbortRef.current = null;

    const fail = () => dispatch({ type: "summary/cancel" });
    void apiGenerateSummary(kind, periodStart)
      .then((summary) => {
        if (summary.status === "completed") {
          finalizeApiSummary(summary.id, kind, targetDateKey);
          return;
        }
        apiSummaryAbortRef.current = streamSummary(summary.id, {
          onCompleted: () => finalizeApiSummary(summary.id, kind, targetDateKey),
          onFailed: fail,
          onTimeout: fail,
          onError: fail,
        });
      })
      .catch(fail);
  };

  // If a pending summary was persisted from a previous session and its
  // willCompleteAt is already past, finish it on mount.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    if (USE_API) return; // API 모드는 pendingSummary 를 영속화하지 않음
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
      // eslint-disable-next-line no-console
      .catch((e) => console.error("[hydrate/todos] 로드 실패:", e));
    // 백엔드 /entries 는 from/to 없으면 빈 배열을 반환하므로 전체 범위를 명시한다.
    void apiListEntries({ from: "1970-01-01", to: "2999-12-31" })
      .then((entries) =>
        dispatch({ type: "hydrate/entries", payload: { entries } }),
      )
      // eslint-disable-next-line no-console
      .catch((e) => console.error("[hydrate/entries] 로드 실패:", e));
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
    void apiListTemplates()
      .then((templates) => {
        // is_active 플래그로 각 retroType의 활성 템플릿 ID 추출
        const activeIds: Record<string, string> = {};
        for (const t of templates) {
          if (t.isActive) activeIds[t.retroType] = t.id;
        }
        dispatch({
          type: "hydrate/templates",
          payload: { templates, activeTemplateIds: activeIds },
        });
      })
      .catch(() => {});
  }, [state.currentUser?.id]);

  // ─── GitHub 연결 프로브 (API·mock 양쪽) ──────────────────────────────────────
  const githubProbedRef = useRef<string | null>(null);
  useEffect(() => {
    const uid = state.currentUser?.id ?? null;
    if (!uid || githubProbedRef.current === uid) return;
    githubProbedRef.current = uid;
    runGitHubRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentUser?.id]);

  // ─── API 모드: 실시간 알림 SSE 구독 (자동 재연결) ───────────────────────────
  useEffect(() => {
    if (!USE_API || !state.currentUser?.id) return;
    let stopped = false;
    let abort: (() => void) | null = null;
    let retryTimer = 0;

    const connect = () => {
      if (stopped) return;
      abort = streamNotifications(
        (notification) =>
          dispatch({ type: "notification/push", payload: { notification } }),
        () => {
          // 5분 타임아웃/오류로 종료 → 재연결
          if (!stopped) retryTimer = window.setTimeout(connect, 3000);
        },
      );
    };
    connect();

    return () => {
      stopped = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      abort?.();
    };
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
  // ─── 디바운스 코얼레싱 큐 ────────────────────────────────────────────────────
  // 변경이 잦은 서버 쓰기(todo/회고/설정/프로필)를 idle 후 1회로 합쳐 보낸다.
  // UI 는 각 핸들러에서 즉시 낙관적 dispatch 하므로 체감 지연은 없다.
  const COALESCE_MS = 1000;

  // 큐 send 클로저는 1회만 생성되므로 최신 state 를 ref 로 참조한다.
  const reportApiErrorRef = useRef<() => void>(() => {});
  reportApiErrorRef.current = reportApiError;
  const latestRef = useRef({
    settings: state.settings,
    entries: state.entries,
  });
  latestRef.current = { settings: state.settings, entries: state.entries };

  type TodoQueuePatch = Partial<
    Pick<Todo, "title" | "status" | "description" | "dateKey">
  > & { startTime?: string | null; endTime?: string | null; timezone?: string | null };
  type EntryQueuePatch = Partial<
    Pick<JournalEntry, "title" | "content" | "retroType">
  >;
  type ProfileQueuePatch = Partial<Pick<User, "displayName" | "avatarUrl">>;
  type TemplateQueuePatch = { name?: string | null; content?: string | null };

  const todoQueueRef = useRef<ReturnType<
    typeof createCoalescingQueue<TodoQueuePatch>
  > | null>(null);
  const entryQueueRef = useRef<ReturnType<
    typeof createCoalescingQueue<EntryQueuePatch>
  > | null>(null);
  const settingsQueueRef = useRef<ReturnType<
    typeof createCoalescingQueue<Partial<AppSettings>>
  > | null>(null);
  const profileQueueRef = useRef<ReturnType<
    typeof createCoalescingQueue<ProfileQueuePatch>
  > | null>(null);
  const templateQueueRef = useRef<ReturnType<
    typeof createCoalescingQueue<TemplateQueuePatch>
  > | null>(null);

  if (!todoQueueRef.current) {
    todoQueueRef.current = createCoalescingQueue<TodoQueuePatch>({
      delayMs: COALESCE_MS,
      send: (id, merged) => apiUpdateTodo(id, merged),
      onError: () => reportApiErrorRef.current(),
    });
  }
  if (!entryQueueRef.current) {
    entryQueueRef.current = createCoalescingQueue<EntryQueuePatch>({
      delayMs: COALESCE_MS,
      send: (id, merged) => {
        const base = latestRef.current.entries.find((e) => e.id === id);
        if (!base) return Promise.resolve();
        return apiUpsertEntry(id, {
          dateKey: base.dateKey,
          title: merged.title ?? base.title,
          content: merged.content ?? base.content,
          retroType: merged.retroType ?? base.retroType,
        });
      },
      onError: () => reportApiErrorRef.current(),
    });
  }
  if (!settingsQueueRef.current) {
    settingsQueueRef.current = createCoalescingQueue<Partial<AppSettings>>({
      delayMs: COALESCE_MS,
      // settings 는 전체 교체(PUT) — 누적 patch(기본 merge: undefined 무시, 최신 우선)를
      // send 시점의 최신 settings 에 합쳐 보낸다. autoSummary 는 호출부에서 항상
      // 완전한 객체를 넘기므로 last-wins 로 충분하다.
      send: (_key, merged) => {
        const cur = latestRef.current.settings;
        const full: AppSettings = {
          ...cur,
          ...merged,
          autoSummary: { ...cur.autoSummary, ...(merged.autoSummary ?? {}) },
        };
        return apiUpdateSettings(full);
      },
      onError: () => reportApiErrorRef.current(),
    });
  }
  if (!profileQueueRef.current) {
    profileQueueRef.current = createCoalescingQueue<ProfileQueuePatch>({
      delayMs: COALESCE_MS,
      send: (_key, merged) => apiUpdateProfile(merged),
      onError: () => reportApiErrorRef.current(),
    });
  }
  if (!templateQueueRef.current) {
    templateQueueRef.current = createCoalescingQueue<TemplateQueuePatch>({
      delayMs: COALESCE_MS,
      send: (id, merged) => apiUpdateTemplate(id, merged),
      onError: () => reportApiErrorRef.current(),
    });
  }

  const todoQueue = todoQueueRef.current;
  const entryQueue = entryQueueRef.current;
  const settingsQueue = settingsQueueRef.current;
  const profileQueue = profileQueueRef.current;
  const templateQueue = templateQueueRef.current;

  // 페이지 이탈/탭 숨김 시 대기 중 변경을 즉시 전송해 유실 창을 최소화.
  useEffect(() => {
    if (!USE_API) return;
    const flushAll = () => {
      todoQueue.flushAll();
      entryQueue.flushAll();
      settingsQueue.flushAll();
      profileQueue.flushAll();
      templateQueue.flushAll();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    window.addEventListener("beforeunload", flushAll);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flushAll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [todoQueue, entryQueue, settingsQueue, profileQueue, templateQueue]);

  // 설정은 전체 교체(PUT)이므로 현재 settings 에 patch 를 합쳐 전송.
  const syncSettings = (patch: Partial<AppSettings>) => {
    settingsQueue.enqueue("settings", patch);
  };

  // ─── GitHub 저장소 연동 (서버 모델) ──────────────────────────────────────────
  /**
   * GET /github/connection 을 짧게 재시도하며 connected 여부를 확인한다.
   * 계정 연결 직후 백엔드 커밋 타이밍 레이스로 첫 조회가 false 일 수 있어,
   * 최대 5회(약 2초)까지 polling 해 즉시 반영을 보장한다.
   */
  const probeGitHubConnected = async (): Promise<boolean> => {
    if (!USE_API) return true;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const conn = await apiGetConnection();
        if (conn.connected) return true;
      } catch {
        // 네트워크 일시 오류 — 재시도
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return false;
  };

  const runGitHubRefresh = () => {
    // 데모: GitHub 연결을 제공하지 않는다(가짜 연결/목 데이터 없이 미연결 유지).
    if (isDemoMode()) {
      dispatch({
        type: "github/setLinked",
        payload: {
          status: "not-connected",
          repositories: [],
          login: null,
          pushTargetRepositoryId: null,
          hasVerifiedEmails: false,
        },
      });
      return;
    }
    if (!USE_API) {
      // mock: "연결됨"으로 간주, 기존 연결 목록 유지, login=developer
      dispatch({
        type: "github/setLinked",
        payload: {
          status: "connected",
          repositories: state.github.linkedRepositories,
          login: MOCK_LOGIN,
          pushTargetRepositoryId: state.github.pushTargetRepositoryId,
          hasVerifiedEmails: true, // mock 모드에서는 항상 정상
        },
      });
      return;
    }
    // GET /github/connection → 연결 상태 + login + pushTarget + hasVerifiedEmails
    void apiGetConnection()
      .then((connection) => {
        if (!connection.connected) {
          dispatch({
            type: "github/setLinked",
            payload: {
              status: "not-connected",
              repositories: [],
              login: null,
              pushTargetRepositoryId: null,
              hasVerifiedEmails: false,
            },
          });
          return;
        }
        // 연결됨 → linked 저장소 목록 로드
        void apiListLinkedRepos()
          .then((repositories) =>
            dispatch({
              type: "github/setLinked",
              payload: {
                status: "connected",
                repositories,
                login: connection.login,
                pushTargetRepositoryId: connection.pushTargetRepositoryId,
                hasVerifiedEmails: connection.hasVerifiedEmails,
              },
            }),
          )
          .catch(() =>
            dispatch({
              type: "github/setLinked",
              payload: {
                status: "connected",
                repositories: [],
                login: connection.login,
                pushTargetRepositoryId: connection.pushTargetRepositoryId,
                hasVerifiedEmails: connection.hasVerifiedEmails,
              },
            }),
          );
      })
      .catch(() => {
        // connection 조회 실패 → 이전 상태 유지하되 unknown 으로
        dispatch({
          type: "github/setStatus",
          payload: { status: "not-connected" },
        });
      });
  };

  // ─── 데모(게스트) 모드 가드 ──────────────────────────────────────────────────
  // 데모에서는 모든 화면을 자유롭게 체험할 수 있고(변경은 로컬·비영속),
  // 외부 의존성(GitHub 연동/동기화)만 차단하고 "로그인" 액션 토스트로 유도한다.
  const isDemo =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "true";

  const requireLoginInDemo = (): boolean => {
    if (!isDemo) return false;
    const locale = state.settings.locale;
    pushNotification(
      "info",
      translate(locale, "demo.locked.title"),
      translate(locale, "demo.locked.message"),
      { actionLabel: translate(locale, "demo.locked.action"), actionHref: "/login" },
    );
    return true;
  };

  // ─── Context value ────────────────────────────────────────────────────────
  const sortedTodos = useMemo(() => sortTodos(state.todos), [state.todos]);
  const sortedState = useMemo(
    () => ({ ...state, todos: sortedTodos }),
    [state, sortedTodos],
  );
  const value: ArchiveAppContextValue = {
    state: sortedState,
    isDemo,
    addTodo: (title, dateKey, options, onCreated) => {
      // 기본 날짜("오늘")는 user.timezone 기준 (데모는 앵커 날짜)
      const resolvedDateKey =
        dateKey ??
        (isDemo
          ? DEMO_ANCHOR_DATE_KEY
          : todayKeyInTz(state.currentUser?.timezone ?? undefined));
      // 현재 시각 기준으로 다음 30분 경계를 시작 시간으로 자동 설정
      const { startTime, endTime } = computeAutoTodoTime();
      if (USE_API) {
        const tz = state.currentUser?.timezone ?? undefined;
        // 서버가 id 를 발급하므로 생성은 await 후 dispatch
        void apiCreateTodo({
          title,
          dateKey: resolvedDateKey,
          status: options?.status,
          description: options?.description,
          startTimeUtc: localTimeToUtcISO(resolvedDateKey, startTime, tz),
          endTimeUtc: localTimeToUtcISO(resolvedDateKey, endTime, tz),
          timezone: tz ?? null,
        })
          .then((todo) => {
            dispatch({ type: "todo/upsert", payload: { todo } });
            onCreated?.(todo.id);
          })
          .catch(() => reportApiError());
        return;
      }
      const newId = createId("todo");
      dispatch({
        type: "todo/add",
        payload: {
          id: newId,
          title,
          dateKey: resolvedDateKey,
          status: options?.status,
          description: options?.description,
          startTime,
          endTime,
        },
      });
      onCreated?.(newId);
    },
    updateTodo: (id, patch) => {
      dispatch({ type: "todo/update", payload: { id, patch } }); // 낙관적
      // 디바운스 코얼레싱 — 빠른 연속 수정(제목/설명 등)을 idle 후 1회 PATCH 로 합침.
      if (USE_API) todoQueue.enqueue(id, patch);
    },
    moveTodo: (id, dateKey) => {
      dispatch({ type: "todo/move", payload: { id, dateKey } }); // 낙관적
      // updateTodo 와 같은 id 큐를 공유 → 수정+이동이 1회 PATCH 로 머지됨.
      if (USE_API) todoQueue.enqueue(id, { dateKey });
    },
    setTodoTime: (id, startTime, endTime) => {
      dispatch({
        type: "todo/update",
        payload: { id, patch: { startTime, endTime } },
      }); // 낙관적 (로컬 "HH:mm")
      if (!USE_API) return;
      // 서버는 UTC ISO + timezone 으로 보관 → 할 일 날짜·사용자 timezone 으로 환산.
      const todo = state.todos.find((t) => t.id === id);
      const dateKey = todo?.dateKey;
      if (!dateKey) return;
      const tz = state.currentUser?.timezone ?? undefined;
      const hasTime = Boolean(startTime || endTime);
      todoQueue.enqueue(id, {
        startTime: startTime ? localTimeToUtcISO(dateKey, startTime, tz) : null,
        endTime: endTime ? localTimeToUtcISO(dateKey, endTime, tz) : null,
        timezone: hasTime ? (tz ?? null) : null,
      });
    },
    updateEntry: (id, patch) => {
      dispatch({ type: "entry/update", payload: { id, patch } }); // 낙관적
      // entry 본문/제목 변경 → readiness 캐시 무효화
      if (patch.content !== undefined || patch.title !== undefined) {
        readinessCacheRef.current.clear();
      }
      // 디바운스 코얼레싱 — 본문 타이핑을 idle 후 1회 upsert 로 합침.
      // (synced 는 서버 githubPush 필드 기반 — base 는 send 시점 최신값 사용)
      if (USE_API) {
        entryQueue.enqueue(id, {
          title: patch.title,
          content: patch.content,
          retroType: patch.retroType,
        });
      }
    },
    createDailyEntry: (dateKey, onIdReplaced) => {
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
      const localId = createId("entry");
      const entry: JournalEntry = {
        id: localId,
        dateKey,
        title: `${dateKey} 일일 회고`,
        content: template?.content ?? "",
        retroType: "daily",
        githubPush: null,
        synced: false,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "entry/upsert", payload: { entry } });
      // 새 entry 추가 → readiness 캐시 무효화
      readinessCacheRef.current.clear();
      if (USE_API) {
        // POST 응답의 서버 ID 로 낙관적 로컬 ID 를 즉시 교체한다.
        // 이후 updateEntry 가 올바른 서버 ID 로 PUT 을 호출하게 된다.
        void apiCreateEntry({
          dateKey,
          title: entry.title,
          content: entry.content,
          retroType: "daily",
        })
          .then((serverEntry) => {
            dispatch({
              type: "entry/replaceId",
              payload: { localId, serverEntry },
            });
            // 호출자(RetrospectiveStudio)가 selectedId 를 서버 ID 로 갱신할 수 있도록 통지
            onIdReplaced?.(serverEntry);
          })
          .catch(() => reportApiError());
      }
      return { entry, existed: false };
    },
    refreshGitHub: () => runGitHubRefresh(),
    loadGitHubAvailableRepos: async (): Promise<AvailableRepository[]> => {
      if (!USE_API) {
        // 이미 연결된 건 후보에서 제외
        const linked = new Set(
          state.github.linkedRepositories.map((r) => r.githubRepoId),
        );
        return MOCK_AVAILABLE_REPOS.filter((r) => !linked.has(r.githubRepoId));
      }
      return apiListAvailableRepos();
    },
    updateLinkedRepo: (repositoryId: string, commitReadEnabled: boolean) => {
      if (requireLoginInDemo()) return;
      // 낙관적 업데이트
      dispatch({
        type: "github/updateLinked",
        payload: { repositoryId, commitReadEnabled },
      });
      if (USE_API) {
        void apiUpdateRepo(repositoryId, { commitReadEnabled }).catch(() => {
          // 롤백
          dispatch({
            type: "github/updateLinked",
            payload: { repositoryId, commitReadEnabled: !commitReadEnabled },
          });
          reportApiError();
        });
      }
    },
    linkGitHubRepo: async (githubRepoId: number) => {
      if (requireLoginInDemo()) return;
      if (!USE_API) {
        const repo = MOCK_AVAILABLE_REPOS.find(
          (r) => r.githubRepoId === githubRepoId,
        );
        if (!repo) return;
        dispatch({
          type: "github/setLinked",
          payload: {
            status: "connected",
            repositories: [
              ...state.github.linkedRepositories,
              mockLinkRepository(repo),
            ],
          },
        });
        return;
      }
      try {
        const linked = await apiLinkRepo(githubRepoId);
        dispatch({
          type: "github/setLinked",
          payload: {
            status: "connected",
            repositories: [...state.github.linkedRepositories, linked],
          },
        });
      } catch {
        reportApiError();
      }
    },
    unlinkGitHubRepo: (repositoryId: string) => {
      if (requireLoginInDemo()) return;
      const next = state.github.linkedRepositories.filter(
        (r) => r.id !== repositoryId,
      );
      dispatch({
        type: "github/setLinked",
        payload: { status: "connected", repositories: next },
      });
      if (USE_API) void apiUnlinkRepo(repositoryId).catch(() => reportApiError());
    },
    unlinkAllGitHubRepos: () => {
      if (requireLoginInDemo()) return;
      dispatch({
        type: "github/setLinked",
        payload: { status: "connected", repositories: [] },
      });
      if (USE_API) void apiUnlinkAllRepos().catch(() => reportApiError());
    },
    syncAllGitHubRepos: async () => {
      if (requireLoginInDemo()) return;
      if (!USE_API) {
        dispatch({
          type: "github/setLinked",
          payload: {
            status: "connected",
            repositories: MOCK_AVAILABLE_REPOS.map(mockLinkRepository),
          },
        });
        return;
      }
      try {
        const repositories = await apiSyncAllRepos();
        dispatch({
          type: "github/setLinked",
          payload: { status: "connected", repositories },
        });
      } catch {
        reportApiError();
      }
    },
    setPushTarget: (repositoryId: string | null) => {
      if (requireLoginInDemo()) return;
      dispatch({ type: "github/setPushTarget", payload: { repositoryId } });
      if (USE_API) {
        void apiSetPushTarget(state.settings, repositoryId).catch(() => {
          // 롤백
          dispatch({
            type: "github/setPushTarget",
            payload: { repositoryId: state.github.pushTargetRepositoryId },
          });
          reportApiError();
        });
      }
    },
    loadCommits: async (date?: string) => {
      // 결과를 전역 state 에 저장하지 않고 직접 반환한다.
      // RetroEditor 가 로컬 useState 로 관리하므로, 다른 날짜 회고로 이동해도
      // 각 에디터 인스턴스(key=entry.id 로 재마운트)가 독립적인 커밋 목록을 가진다.
      if (!USE_API) {
        return MOCK_COMMITS;
      }
      try {
        return await apiGetCommits(date);
      } catch {
        // 커밋 로드 실패 → 빈 배열 (toast 없음)
        return [];
      }
    },
    pushRetrospective: async (
      retroType: "daily" | "weekly" | "monthly" | "yearly",
      dateKey: string,
      contentMarkdown: string,
    ): Promise<PushRetrospectiveResult> => {
      if (requireLoginInDemo()) {
        return { ok: false, error: "demo" };
      }
      const periodTypeMap = {
        daily: "DAILY",
        weekly: "WEEKLY",
        monthly: "MONTHLY",
        yearly: "ANNUAL",
      } as const;
      const periodType = periodTypeMap[retroType];
      const periodKey = toPeriodKey(retroType, dateKey);

      if (!USE_API) {
        // mock: 성공 응답 반환
        return {
          ok: true,
          commitSha: "mock_sha_" + Math.random().toString(36).slice(2, 8),
          htmlUrl: "https://github.com/developer/archive-journal",
          path: `daily/${dateKey} 회고록.md`,
        };
      }

      try {
        const result = await apiPushRetrospective({
          periodType,
          periodKey,
          contentMarkdown,
        });
        // push 성공 → 해당 entry 를 서버에서 재조회해 githubPush 필드 반영
        // (서버가 push 레코드를 생성하므로 synced=true 가 자동으로 결정됨)
        const entry = state.entries.find(
          (e) => e.dateKey === dateKey && e.retroType === retroType,
        );
        if (entry) {
          void apiGetEntry(entry.id)
            .then((updated) =>
              dispatch({ type: "entry/upsert", payload: { entry: updated } }),
            )
            .catch(() => {
              // 재조회 실패 시 낙관적으로 synced 마킹 (다음 하이드레이션에서 정합)
              dispatch({
                type: "entry/update",
                payload: { id: entry.id, patch: { synced: true } },
              });
            });
        }
        return { ok: true, ...result };
      } catch (e) {
        const err =
          e instanceof ApiError ? e.code : "GITHUB_PUSH_FAILED";
        return { ok: false, error: err };
      }
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
    checkSummaryReadiness: async (kind, periodStart) => {
      // weekly 는 readiness 미지원 → null (바로 생성)
      if (kind === "weekly") return null;
      // mock 모드는 점검 생략
      if (!USE_API) return null;
      // periodStart 별로 캐시 키를 분리한다 (기간 선택 시 기간마다 점검 결과가 다름).
      const cacheKey = `${kind}:${periodStart ?? "default"}`;
      const cached = readinessCacheRef.current.get(cacheKey);
      if (cached) return cached;
      try {
        const readiness = await apiGetSummaryReadiness(kind, periodStart);
        readinessCacheRef.current.set(cacheKey, readiness);
        return readiness;
      } catch (e) {
        // 정상 흐름(monthly/annual)에서는 도달하지 않음. 422/네트워크 오류는
        // 방어적으로 null 반환 → 점검 없이 생성 진행.
        if (
          e instanceof ApiError &&
          e.code === "RETRO_SUMMARY_READINESS_UNSUPPORTED"
        ) {
          console.warn("[summary] readiness 미지원 호출:", kind);
        }
        return null;
      }
    },
    checkRetroExists: async (kind, periodStart, periodEnd) => {
      const retroType = KIND_TO_TYPE[kind];
      if (USE_API) {
        // 서버를 진실 공급원으로 조회. 로컬 상태에 의존하지 않는다.
        try {
          const existing = await apiListEntries({
            retroType,
            from: periodStart,
            to: periodEnd,
          });
          return existing.length > 0;
        } catch (e) {
          // 조회 실패 시 보수적으로 "없음" 처리 → 생성 시 서버 409 로 안전망 동작.
          console.warn("[checkRetroExists] 조회 실패:", e);
          return false;
        }
      }
      // mock 모드: 로컬 상태에서 기간 내 동일 retroType entry 존재 여부 확인.
      return state.entries.some(
        (e) =>
          e.retroType === retroType &&
          e.dateKey >= periodStart &&
          e.dateKey <= periodEnd,
      );
    },
    startSummary: (kind, targetDateKey, periodStart) => {
      if (USE_API) startSummaryViaApi(kind, targetDateKey, periodStart);
      else startSummaryInternal(kind, targetDateKey);
    },
    minimizeSummary: () => dispatch({ type: "summary/minimize" }),
    completeSummary: () => {
      const p = state.pendingSummary;
      if (!p) return;
      // API 모드는 서버 완료를 강제할 수 없음 → 스트림 종료 + 취소만
      if (USE_API) {
        apiSummaryAbortRef.current?.();
        apiSummaryAbortRef.current = null;
        dispatch({ type: "summary/cancel" });
        return;
      }
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
      completeSummaryFor(p.kind, p.targetDateKey);
    },
    cancelSummary: () => {
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
      apiSummaryAbortRef.current?.();
      apiSummaryAbortRef.current = null;
      dispatch({ type: "summary/cancel" });
    },
    // ─── Templates ──────────────────────────────────────────────────────────
    addTemplate: (retroType, name, content) => {
      const localId = createId("template");
      const template: RetroTemplate = {
        id: localId,
        name,
        retroType,
        content,
        isDefault: false,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "template/add", payload: { template } });
      if (USE_API) {
        void apiCreateTemplate({ retroType, name, content })
          .then((serverTemplate) => {
            // 로컬 낙관적 ID → 서버 ID 교체
            dispatch({
              type: "template/replaceId",
              payload: { localId, serverTemplate },
            });
          })
          .catch(() => reportApiError());
      }
      return template;
    },
    updateTemplate: (id, patch) => {
      dispatch({ type: "template/update", payload: { id, patch } });
      if (USE_API) {
        templateQueue.enqueue(id, {
          name: patch.name,
          content: patch.content,
        });
      }
    },
    deleteTemplate: (id) => {
      dispatch({ type: "template/delete", payload: { id } });
      if (USE_API) {
        void apiDeleteTemplate(id).catch(() => reportApiError());
      }
    },
    resetTemplate: (retroType) => {
      dispatch({ type: "template/resetDefault", payload: { retroType } });
      if (USE_API) {
        const defaultTpl = state.templates.find(
          (t) => t.retroType === retroType && t.isDefault,
        );
        if (defaultTpl) {
          void apiResetTemplate(defaultTpl.id)
            .then((serverTemplate) => {
              dispatch({
                type: "template/update",
                payload: {
                  id: serverTemplate.id,
                  patch: { content: serverTemplate.content, name: serverTemplate.name },
                },
              });
            })
            .catch(() => reportApiError());
        }
      }
    },
    setActiveTemplate: (retroType, id) => {
      dispatch({ type: "template/setActive", payload: { retroType, id } });
      if (USE_API) {
        void apiSetActiveTemplate(retroType, id).catch(() => reportApiError());
      }
    },
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
      if (USE_API) {
        // 대기 중 변경을 세션 종료 전에 모두 전송.
        todoQueue.flushAll();
        entryQueue.flushAll();
        settingsQueue.flushAll();
        profileQueue.flushAll();
        templateQueue.flushAll();
        void apiLogout();
      }
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
      if (result.kind === "success") {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe: true },
        });
      }
      // onboarding-required / error 는 호출 측(OAuthButtons)이 라우팅 처리
      return result;
    },
    completeOnboarding: async (input) => {
      const result = USE_API
        ? await apiCompleteOnboarding(input)
        : await mockCompleteOnboarding(input);
      if (result.ok) {
        dispatch({
          type: "auth/login",
          payload: { user: result.user, rememberMe: true },
        });
      }
      return result;
    },
    // 비밀번호 재설정 (이메일 토큰 링크 방식)
    requestPasswordReset: (email) =>
      USE_API ? apiRequestPasswordReset(email) : mockRequestPasswordReset(email),
    confirmPasswordReset: (token, newPassword, newPasswordConfirm) =>
      USE_API
        ? apiConfirmPasswordReset(token, newPassword, newPasswordConfirm)
        : mockConfirmPasswordReset(token, newPassword),
    updateProfile: (patch: Partial<Pick<User, "displayName" | "avatarUrl">>) => {
      dispatch({ type: "auth/updateProfile", payload: { patch } }); // 낙관적
      // 디바운스 코얼레싱 — displayName 타이핑을 idle 후 1회 PATCH 로 합침.
      if (USE_API) profileQueue.enqueue("profile", patch);
    },
    // ─── 지역/시간대 ────────────────────────────────────────────────────────
    /**
     * 국가의 IANA timezone 목록 조회. multi=true 면 사용자가 timezone 을 직접 선택.
     * mock 모드: COUNTRY_PRIMARY_TZ 를 단일 요소로, MULTI_TZ_COUNTRIES 로 multi 판단.
     */
    loadCountryTimezones: async (code) => {
      if (!USE_API) {
        const tz = countryDefaultTimezone(code);
        const multi = MULTI_TZ_COUNTRIES.includes(code as MultiTzCountry);
        const tzList = tz ? [tz] : supportedTimeZones().slice(0, 20);
        return { multi, timezones: tzList };
      }
      try {
        return await apiGetCountryTimezones(code);
      } catch {
        // 실패 시 빈 목록 (단일 tz 로 간주)
        return { multi: false, timezones: [] };
      }
    },
    updateCountry: async (country, timezone, keepCurrentTimezone = false) => {
      if (requireLoginInDemo()) return { ok: false };
      const prevTz = state.currentUser?.timezone ?? null;
      if (!USE_API) {
        // mock: 국가 + timezone 갱신
        dispatch({
          type: "auth/updateUser",
          payload: { patch: { country, region: null, timezone: timezone ?? prevTz ?? undefined } },
        });
        return { ok: true };
      }
      try {
        const displayName = state.currentUser?.displayName;
        const user = await apiUpdateCountry(country, timezone, { displayName });
        dispatch({
          type: "auth/updateUser",
          payload: {
            patch: {
              country: user.country,
              region: user.region,
              timezone: user.timezone,
            },
          },
        });
        // 기존 요약 시간(timezone) 유지를 원하면 이전 tz 로 되돌린다
        if (keepCurrentTimezone && prevTz && prevTz !== user.timezone) {
          const restored = await apiUpdateTimezone(prevTz, { displayName });
          dispatch({
            type: "auth/updateUser",
            payload: { patch: { timezone: restored.timezone } },
          });
        }
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError) {
          // 다중 tz 국가인데 timezone 을 선택하지 않은 경우
          if (err.code === "AUTH_COUNTRY_TIMEZONE_REQUIRED") {
            pushNotification(
              "warning",
              translate(state.settings.locale, "settings.region.apply"),
              translate(state.settings.locale, "settings.region.selectTimezoneHint"),
              { transient: true },
            );
            return { ok: false };
          }
        }
        reportApiError();
        return { ok: false };
      }
    },
    updateTimezone: async (timezone) => {
      if (requireLoginInDemo()) return { ok: false };
      if (!USE_API) {
        dispatch({
          type: "auth/updateUser",
          payload: { patch: { timezone } },
        });
        return { ok: true };
      }
      try {
        const displayName = state.currentUser?.displayName;
        const user = await apiUpdateTimezone(timezone, { displayName });
        dispatch({
          type: "auth/updateUser",
          payload: { patch: { timezone: user.timezone } },
        });
        return { ok: true };
      } catch {
        reportApiError();
        return { ok: false };
      }
    },
    linkGitHubAccount: async () => {
      if (requireLoginInDemo()) return { ok: false, error: "demo" };
      if (!USE_API) {
        // mock: 즉시 연결됨 처리
        dispatch({ type: "github/setStatus", payload: { status: "connected" } });
        runGitHubRefresh();
        return { ok: true };
      }
      const result = await apiLinkOAuth("github");
      // 콜백 postMessage 를 받았든(ok) 놓쳤든(popup-closed/origin 불일치) 서버
      // 연결 상태를 직접 재확인해 즉시 UI 에 반영한다. 백엔드가 link 를 막 커밋한
      // 직후라 첫 조회가 아직 connected=false 일 수 있어 짧게 몇 번 재시도한다
      // (새로고침해야만 반영되던 레이스 제거).
      const probedConnected = await probeGitHubConnected();
      if (probedConnected) {
        runGitHubRefresh();
        return { ok: true };
      }
      return result;
    },
    // ─── 세션 관리 ───────────────────────────────────────────────────────────
    listSessions: () => (USE_API ? apiListSessions() : mockListSessions()),
    revokeSession: async (sessionId: string) => {
      if (requireLoginInDemo()) return { ok: false };
      try {
        if (USE_API) await apiRevokeSession(sessionId);
        else await mockRevokeSession(sessionId);
        return { ok: true };
      } catch {
        reportApiError();
        return { ok: false };
      }
    },
    revokeOtherSessions: async () => {
      if (requireLoginInDemo()) return { ok: false };
      try {
        const revokedCount = USE_API
          ? await apiRevokeOtherSessions()
          : await mockRevokeOtherSessions();
        return { ok: true, revokedCount };
      } catch {
        reportApiError();
        return { ok: false };
      }
    },
    // ─── 보안(탈취 감지) ─────────────────────────────────────────────────────
    securityLogout,
    dismissSecurityLogout: () => setSecurityLogout(false),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <SecurityLogoutModal
        open={securityLogout}
        locale={state.settings.locale}
        onConfirm={() => setSecurityLogout(false)}
      />
    </AppContext.Provider>
  );
}

/** 탈취 의심(refresh 재사용)으로 강제 로그아웃 시 뜨는 보안 경고 모달. */
function SecurityLogoutModal({
  open,
  locale,
  onConfirm,
}: {
  open: boolean;
  locale: Locale;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <ConfirmModal
      open={open}
      hideCancel
      title={translate(locale, "security.reuse.title")}
      message={translate(locale, "security.reuse.message")}
      confirmLabel={translate(locale, "security.reuse.action")}
      cancelLabel={translate(locale, "security.reuse.action")}
      onConfirm={onConfirm}
      onCancel={onConfirm}
      onDismiss={onConfirm}
    />
  );
}

// re-export for convenience
export type { NoticeCategory };
