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
  //
  // - dateKey 단위로 묶어서 폴링한다: 같은 날짜에 pending/syncing 할 일이 여러 개면
  //   todo 개수만큼 동일한 GET /todos 요청이 중복 발사되던 문제를 방지한다.
  // - 12회(60초) 시도 후에도 안 풀리면 giveUpIdsRef 에 남겨 재시도하지 않는다.
  //   state.todos 참조는 다른 화면 이동(hydrate/todos)만으로도 자주 바뀌는데,
  //   giveUp 표시가 없으면 그때마다 이 effect 가 같은 할 일의 폴링을 처음부터
  //   다시 시작해 사실상 무한 폴링처럼 보이는 문제가 있었다. 다만 해당 할 일이
  //   이후 새로운 push 시도(= 이전 상태가 pending/syncing 이 아니었다가 다시
  //   pending/syncing 으로 전환)로 들어가면 giveUp 기록을 지워 재시도를 허용한다.
  const pollingIdsRef = useRef<Set<string>>(new Set());
  const gaveUpIdsRef = useRef<Set<string>>(new Set());
  const prevStatusRef = useRef<Map<string, Todo["calendarPushStatus"]>>(new Map());
  useEffect(() => {
    if (!USE_API || isDemoMode()) return;

    const byDateKey = new Map<string, string[]>();
    for (const todo of todos) {
      const prevStatus = prevStatusRef.current.get(todo.id);
      prevStatusRef.current.set(todo.id, todo.calendarPushStatus);

      const isPending = todo.calendarPushStatus === "pending" || todo.calendarPushStatus === "syncing";
      if (!isPending) {
        gaveUpIdsRef.current.delete(todo.id);
        continue;
      }
      const wasPending = prevStatus === "pending" || prevStatus === "syncing";
      if (!wasPending) gaveUpIdsRef.current.delete(todo.id);

      if (gaveUpIdsRef.current.has(todo.id) || pollingIdsRef.current.has(todo.id)) continue;

      pollingIdsRef.current.add(todo.id);
      const ids = byDateKey.get(todo.dateKey) ?? [];
      ids.push(todo.id);
      byDateKey.set(todo.dateKey, ids);
    }

    for (const [dateKey, todoIds] of byDateKey) {
      let attempts = 0;
      const poll = () => {
        const pending = todoIds.filter((id) => pollingIdsRef.current.has(id));
        if (pending.length === 0) return;
        if (++attempts > 12) {
          for (const id of pending) {
            pollingIdsRef.current.delete(id);
            gaveUpIdsRef.current.add(id);
          }
          return;
        }
        void apiListTodos({ from: dateKey, to: dateKey })
          .then((fetched) => {
            let stillPending = false;
            for (const id of pending) {
              const updated = fetched.find((t) => t.id === id);
              if (!updated) { pollingIdsRef.current.delete(id); continue; }
              if (updated.calendarPushStatus !== "pending" && updated.calendarPushStatus !== "syncing") {
                dispatch({ type: "todo/set-calendar", payload: {
                  id,
                  calendarLinked: updated.calendarLinked,
                  calendarPushStatus: updated.calendarPushStatus,
                }});
                pollingIdsRef.current.delete(id);
              } else {
                stillPending = true;
              }
            }
            if (stillPending) window.setTimeout(poll, 5000);
          })
          .catch(() => { window.setTimeout(poll, 5000); });
      };
      window.setTimeout(poll, 5000);
    }
    // state.todos 가 바뀔 때만 새 pending 항목을 감지하면 충분(pollingIdsRef/gaveUpIdsRef 로 중복·재시작 방지).
  }, [todos, dispatch]);
}
