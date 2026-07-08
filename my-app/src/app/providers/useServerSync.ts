import { useCallback, useEffect, useRef, type Dispatch } from "react";
import type { AppAction } from "@/app/model/actions";
import type { JournalEntry } from "@/entities/entry/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { isDemoMode } from "@/app/config/demo";
import {
  USE_API,
  apiListNotifications,
  apiListSummaries,
  apiListTodos,
  streamNotifications,
} from "@/shared/api";

export interface UseServerSyncArgs {
  userId: string | undefined;
  todos: Todo[];
  dispatch: Dispatch<AppAction>;
}

/**
 * API 모드의 서버 동기화 인프라를 캡슐화한다:
 *  1. 실시간 알림 SSE 구독(자동 재연결) — 요약 완료 알림 시 silent refetch.
 *  2. 캘린더 동기화 폴링 폴백 — SSE 이벤트 유실 대비 pending/syncing 할 일 재조회.
 * 데모/mock 모드에서는 아무 것도 하지 않는다.
 */
export function useServerSync({ userId, todos, dispatch }: UseServerSyncArgs) {
  // 이미 처리한 summary 알림 ID — 재연결 replay 와 per-summary SSE 중복 처리 방지.
  const processedNotifIdsRef = useRef<Set<string>>(new Set());

  // 모든 요약 타입을 재조회해 state 에 upsert — 토스트 없이 silent 갱신.
  const refetchSummaries = useCallback(async () => {
    try {
      const [weekly, monthly, annual] = await Promise.all([
        apiListSummaries("weekly").catch((): JournalEntry[] => []),
        apiListSummaries("monthly").catch((): JournalEntry[] => []),
        apiListSummaries("annual").catch((): JournalEntry[] => []),
      ]);
      for (const entry of [...weekly, ...monthly, ...annual]) {
        dispatch({ type: "entry/upsert", payload: { entry } });
      }
    } catch {
      /* 네트워크 오류 — 다음 재연결 시 보정 */
    }
  }, [dispatch]);

  // ─── 실시간 알림 SSE 구독 (자동 재연결) ───────────────────────────────────
  useEffect(() => {
    if (!USE_API || !userId) return;
    let stopped = false;
    let abort: (() => void) | null = null;
    let retryTimer = 0;

    const connect = () => {
      if (stopped) return;
      abort = streamNotifications(
        (notification) => {
          dispatch({ type: "notification/push", payload: { notification } });
          // category === "summary" 알림 = 서버 자동 요약 완료/실패 신호.
          // notification.id 기준 dedup 후 silent refetch(토스트는 알림 패널이 담당).
          if (notification.category === "summary") {
            if (!processedNotifIdsRef.current.has(notification.id)) {
              processedNotifIdsRef.current.add(notification.id);
              void refetchSummaries();
            }
          }
        },
        () => {
          // SSE 종료(5분 타임아웃 등) → 재연결 + 누락 변경 보정 refetch
          if (!stopped) {
            void refetchSummaries();
            void apiListNotifications()
              .then((notifications) =>
                dispatch({ type: "hydrate/notifications", payload: { notifications } }),
              )
              .catch(() => {});
            retryTimer = window.setTimeout(connect, 3000);
          }
        },
        ({ todoId, calendarLinked, calendarPushStatus }) => {
          dispatch({ type: "todo/set-calendar", payload: { id: todoId, calendarLinked, calendarPushStatus } });
        },
      );
    };
    connect();

    return () => {
      stopped = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      abort?.();
    };
  }, [userId, refetchSummaries, dispatch]);

  // ─── 캘린더 동기화 폴링 폴백 ───────────────────────────────────────────────
  // SSE 이벤트가 유실될 경우를 대비해 "pending/syncing" 할 일을 주기적으로 재조회한다.
  // hydrate/todos 전체 교체 대신 해당 할 일의 calendarPushStatus 만 갱신한다.
  const pollingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!USE_API || isDemoMode()) return;
    for (const todo of todos) {
      if (
        (todo.calendarPushStatus === "pending" || todo.calendarPushStatus === "syncing") &&
        !pollingIdsRef.current.has(todo.id)
      ) {
        pollingIdsRef.current.add(todo.id);
        const todoId = todo.id;
        const dateKey = todo.dateKey;
        let attempts = 0;
        const poll = () => {
          if (++attempts > 12) { pollingIdsRef.current.delete(todoId); return; }
          void apiListTodos({ from: dateKey, to: dateKey })
            .then((fetched) => {
              const updated = fetched.find((t) => t.id === todoId);
              if (!updated) { pollingIdsRef.current.delete(todoId); return; }
              if (updated.calendarPushStatus !== "pending" && updated.calendarPushStatus !== "syncing") {
                dispatch({ type: "todo/set-calendar", payload: {
                  id: todoId,
                  calendarLinked: updated.calendarLinked,
                  calendarPushStatus: updated.calendarPushStatus,
                }});
                pollingIdsRef.current.delete(todoId);
              } else {
                window.setTimeout(poll, 5000);
              }
            })
            .catch(() => { window.setTimeout(poll, 5000); });
        };
        window.setTimeout(poll, 5000);
      }
    }
    // state.todos 가 바뀔 때만 새 pending 항목을 감지하면 충분(pollingIdsRef 로 중복 방지).
  }, [todos, dispatch]);
}
