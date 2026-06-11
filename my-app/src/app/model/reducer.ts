import type { AppAction } from "@/app/model/actions";
import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { AppState } from "@/app/model/types";
import type { JournalEntry } from "@/entities/entry/model/types";
import { INITIAL_GITHUB_STATE } from "@/entities/github/model/types";
import type { NotificationItem } from "@/entities/notification/model/types";
import { DEFAULT_TEMPLATE_CONTENT, defaultTemplateId } from "@/entities/template";
import type { Todo } from "@/entities/todo/model/types";
import { createId } from "@/shared/lib/id";

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "todo/add":
      return {
        ...state,
        todos: [
          ...state.todos,
          createTodo(
            action.payload.title,
            action.payload.dateKey,
            action.payload.status,
            action.payload.description,
            action.payload.id,
          ),
        ],
      };

    case "todo/update":
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload.id
            ? applyTodoPatch(todo, action.payload.patch)
            : todo,
        ),
      };

    case "todo/move":
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload.id
            ? { ...todo, dateKey: action.payload.dateKey }
            : todo,
        ),
      };

    case "todo/upsert": {
      const idx = state.todos.findIndex((t) => t.id === action.payload.todo.id);
      if (idx >= 0) {
        const next = state.todos.slice();
        next[idx] = action.payload.todo;
        return { ...state, todos: next };
      }
      return { ...state, todos: [...state.todos, action.payload.todo] };
    }

    case "todo/remove":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload.id),
      };

    case "hydrate/todos":
      return { ...state, todos: action.payload.todos };

    case "hydrate/entries":
      return { ...state, entries: action.payload.entries };

    case "hydrate/notifications":
      return { ...state, notifications: action.payload.notifications };

    case "hydrate/settings":
      return { ...state, settings: action.payload.settings };

    case "entry/update":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id
            ? {
                ...entry,
                ...action.payload.patch,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      };

    case "entry/upsert": {
      const existingIndex = state.entries.findIndex(
        (e) => e.id === action.payload.entry.id,
      );
      if (existingIndex >= 0) {
        const next = state.entries.slice();
        next[existingIndex] = {
          ...next[existingIndex],
          ...action.payload.entry,
          updatedAt: new Date().toISOString(),
        };
        return { ...state, entries: next };
      }
      return {
        ...state,
        entries: [...state.entries, action.payload.entry],
      };
    }

    // POST/PUT 응답의 서버 entry 로 낙관적 로컬 entry 를 교체한다.
    // localId 항목과 serverEntry.id 를 이미 가진 항목(예: 하이드레이션된 동일
    // entry)을 모두 제거한 뒤 serverEntry 하나만 남긴다 → 어떤 경로(요약 덮어쓰기
    // 등)에서도 동일 entry 가 중복 생성되지 않게 한다.
    case "entry/replaceId": {
      const { localId, serverEntry } = action.payload;
      const rest = state.entries.filter(
        (e) => e.id !== localId && e.id !== serverEntry.id,
      );
      return { ...state, entries: [...rest, serverEntry] };
    }

    case "todo/replaceId": {
      const { localId, serverTodo } = action.payload;
      // entry/replaceId 와 동일하게 중복(localId + serverTodo.id) 제거 후 단일 유지.
      const rest = state.todos.filter(
        (t) => t.id !== localId && t.id !== serverTodo.id,
      );
      return { ...state, todos: [...rest, serverTodo] };
    }

    case "github/setStatus":
      return {
        ...state,
        github: { ...state.github, status: action.payload.status },
      };

    case "github/setLinked":
      return {
        ...state,
        github: {
          ...state.github,
          status: action.payload.status,
          linkedRepositories: action.payload.repositories,
          ...(action.payload.login !== undefined
            ? { login: action.payload.login }
            : {}),
          ...(action.payload.pushTargetRepositoryId !== undefined
            ? { pushTargetRepositoryId: action.payload.pushTargetRepositoryId }
            : {}),
          ...(action.payload.hasVerifiedEmails !== undefined
            ? { hasVerifiedEmails: action.payload.hasVerifiedEmails }
            : {}),
        },
      };

    case "github/updateLinked":
      return {
        ...state,
        github: {
          ...state.github,
          linkedRepositories: state.github.linkedRepositories.map((r) =>
            r.id === action.payload.repositoryId
              ? { ...r, commitReadEnabled: action.payload.commitReadEnabled }
              : r,
          ),
        },
      };

    case "github/setPushTarget":
      return {
        ...state,
        github: {
          ...state.github,
          pushTargetRepositoryId: action.payload.repositoryId,
        },
      };

    case "github/setCommits":
      return {
        ...state,
        github: { ...state.github, commits: action.payload.commits },
      };

    case "notification/push":
      // 동일 id 는 무시 (하이드레이션 ↔ SSE 실시간 수신 중복 방지)
      if (
        state.notifications.some((n) => n.id === action.payload.notification.id)
      ) {
        return state;
      }
      return {
        ...state,
        notifications: [action.payload.notification, ...state.notifications],
      };

    case "notification/dismiss":
    case "notification/clear":
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload.id,
        ),
      };

    case "notification/markRead":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, read: true } : n,
        ),
      };

    case "notification/markAllRead":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.read ? n : { ...n, read: true },
        ),
      };

    case "notification/clearRead":
      return {
        ...state,
        notifications: state.notifications.filter((n) => !n.read),
      };

    case "notification/clearAll":
      return { ...state, notifications: [] };

    case "notification/cleanup": {
      const cutoff =
        Date.now() - action.payload.retentionDays * 24 * 60 * 60 * 1000;
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => new Date(n.timestamp).getTime() >= cutoff,
        ),
      };
    }

    case "settings/locale":
      return {
        ...state,
        settings: { ...state.settings, locale: action.payload.locale },
      };

    case "settings/autoSummary":
      return {
        ...state,
        settings: {
          ...state.settings,
          autoSummary: {
            ...state.settings.autoSummary,
            ...action.payload.patch,
          },
        },
      };

    case "settings/retention":
      return {
        ...state,
        settings: {
          ...state.settings,
          notificationRetentionDays: action.payload.days,
        },
      };

    case "settings/scheduleCheck":
      return {
        ...state,
        settings: {
          ...state.settings,
          lastScheduleCheckAt: action.payload.timestamp,
        },
      };

    case "summary/start": {
      const now = new Date();
      return {
        ...state,
        pendingSummary: {
          id: createId("summary"),
          kind: action.payload.kind,
          startedAt: now.toISOString(),
          willCompleteAt: new Date(now.getTime() + 6000).toISOString(),
          minimized: false,
          targetDateKey: action.payload.targetDateKey,
        },
      };
    }

    case "summary/minimize":
      if (!state.pendingSummary) return state;
      return {
        ...state,
        pendingSummary: { ...state.pendingSummary, minimized: true },
      };

    case "summary/cancel":
      return { ...state, pendingSummary: null };

    case "summary/setPending":
      return { ...state, pendingSummary: action.payload.pending };

    case "summary/complete":
      return { ...state, pendingSummary: null };

    case "template/add":
      return {
        ...state,
        templates: [...state.templates, action.payload.template],
      };

    case "template/update":
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.payload.id
            ? { ...t, ...action.payload.patch, updatedAt: new Date().toISOString() }
            : t,
        ),
      };

    case "template/delete": {
      const deleted = state.templates.find((t) => t.id === action.payload.id);
      const nextActive = { ...state.activeTemplateIds };
      // 삭제한 템플릿이 활성 상태였다면 해당 타입의 기본 템플릿으로 되돌린다
      if (deleted && nextActive[deleted.retroType] === deleted.id) {
        nextActive[deleted.retroType] = defaultTemplateId(deleted.retroType);
      }
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload.id),
        activeTemplateIds: nextActive,
      };
    }

    case "template/setActive":
      return {
        ...state,
        activeTemplateIds: {
          ...state.activeTemplateIds,
          [action.payload.retroType]: action.payload.id,
        },
      };

    case "template/resetDefault":
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.retroType === action.payload.retroType && t.isDefault
            ? {
                ...t,
                content: DEFAULT_TEMPLATE_CONTENT[action.payload.retroType],
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      };

    case "auth/login":
      return {
        ...state,
        currentUser: action.payload.user,
        rememberMe: action.payload.rememberMe,
        // GitHub 연결 상태는 계정/세션에 종속 → 로그인 시 초기화하고 서버에서 재조회.
        github: INITIAL_GITHUB_STATE,
      };

    case "auth/logout":
      return {
        ...state,
        currentUser: null,
        rememberMe: false,
        github: INITIAL_GITHUB_STATE,
      };

    case "auth/updateProfile":
      if (!state.currentUser) return state;
      return {
        ...state,
        currentUser: { ...state.currentUser, ...action.payload.patch },
      };

    case "auth/updateUser":
      if (!state.currentUser) return state;
      return {
        ...state,
        currentUser: { ...state.currentUser, ...action.payload.patch },
      };

    default:
      return state;
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function createTodo(
  title: string,
  dateKey: string,
  status: Todo["status"] = "not-start",
  description = "",
  id?: string,
): Todo {
  const now = new Date().toISOString();
  return {
    id: id ?? createId("todo"),
    title,
    completed: status === "done",
    dateKey,
    createdAt: now,
    completedAt: status === "done" ? now : null,
    status,
    description,
  };
}

function applyTodoPatch(
  todo: Todo,
  patch: Partial<
    Pick<
      Todo,
      "title" | "status" | "description" | "dateKey" | "startTime" | "endTime"
    >
  >,
): Todo {
  const nextStatus = patch.status ?? todo.status;
  const becameDone = nextStatus === "done" && todo.status !== "done";
  const leftDone = nextStatus !== "done" && todo.status === "done";

  return {
    ...todo,
    ...patch,
    status: nextStatus,
    completed: nextStatus === "done",
    completedAt: becameDone
      ? new Date().toISOString()
      : leftDone
        ? null
        : todo.completedAt,
  };
}

export function ensureSettings(
  partial: Partial<AppState["settings"]> | undefined,
): AppState["settings"] {
  if (!partial) return { ...DEFAULT_SETTINGS };
  return {
    locale: partial.locale ?? DEFAULT_SETTINGS.locale,
    autoSummary: {
      ...DEFAULT_SETTINGS.autoSummary,
      ...(partial.autoSummary ?? {}),
    },
    notificationRetentionDays:
      partial.notificationRetentionDays ??
      DEFAULT_SETTINGS.notificationRetentionDays,
    lastScheduleCheckAt:
      partial.lastScheduleCheckAt ?? DEFAULT_SETTINGS.lastScheduleCheckAt,
  };
}

// re-exports so other modules can import these from one place
export type { JournalEntry, NotificationItem };
