import { useSyncExternalStore } from "react";
import type { Todo } from "@/entities/todo/model/types";

/**
 * 캘린더 사이드바의 거르기(태그 하나, 숨긴 사용자 캘린더). 캘린더 화면과 할 일 화면이 같은
 * 사이드바(CalendarSidebar)를 쓰므로 화면을 옮겨도 유지되게 모듈 저장소에 둔다(AppProvider 밖).
 */
export interface CalendarFilterState {
  /** 고른 태그. null = 전체. */
  tag: string | null;
  /** 숨긴 사용자 캘린더 id. */
  hidden: ReadonlySet<string>;
}

let state: CalendarFilterState = { tag: null, hidden: new Set() };
const listeners = new Set<() => void>();

function set(next: CalendarFilterState) {
  state = next;
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** "이것만 보기": 이미 그것만 보이고 있으면 전부 보이기, 아니면 나머지를 숨김. */
export function soloHidden(hidden: ReadonlySet<string>, id: string, allIds: readonly string[]): Set<string> {
  const alreadySolo = allIds.every((c) => (c === id) !== hidden.has(c));
  return new Set(alreadySolo ? [] : allIds.filter((c) => c !== id));
}

/** 태그와 캘린더 거르기를 통과하는지. calendarId 는 사용자 캘린더 기능이 꺼져 있으면 null. */
export function passesFilter(todo: Todo, filter: CalendarFilterState, calendarId: string | null): boolean {
  if (filter.tag && !todo.tags.includes(filter.tag)) return false;
  if (calendarId && filter.hidden.has(calendarId)) return false;
  return true;
}

export const calendarFilterActions = {
  setTag(tag: string | null) {
    set({ ...state, tag });
  },
  toggleCalendar(id: string) {
    const hidden = new Set(state.hidden);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    set({ ...state, hidden });
  },
  soloCalendar(id: string, allIds: readonly string[]) {
    set({ ...state, hidden: soloHidden(state.hidden, id, allIds) });
  },
  forgetCalendar(id: string) {
    if (!state.hidden.has(id)) return;
    const hidden = new Set(state.hidden);
    hidden.delete(id);
    set({ ...state, hidden });
  },
};

export function useCalendarFilter(): CalendarFilterState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}
