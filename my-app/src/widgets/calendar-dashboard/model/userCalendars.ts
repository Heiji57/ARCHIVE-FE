import { useCallback, useSyncExternalStore } from "react";
import { DEMO_TODO_CALENDAR, DEMO_USER_CALENDARS } from "@/entities/calendar/model/demo";
import { CALENDAR_COLORS, type CalendarColor, type UserCalendar } from "@/entities/calendar/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { calendarFilterActions } from "./calendarFilter";

/**
 * 사용자 캘린더(개인, 팀, 스터디). 서버에 아직 없어(`userCalendars`) 데모 모드에서만 데모 데이터로 보인다.
 * 데모에서 바꾼 것(이름, 색, 기본, 새 캘린더, 할 일 배정)은 화면 안에서만 유지된다.
 */
interface Store {
  calendars: UserCalendar[];
  /** 할 일 id → 캘린더 id. 없으면 기본 캘린더. */
  assign: Record<string, string>;
}

let store: Store = { calendars: [...DEMO_USER_CALENDARS], assign: { ...DEMO_TODO_CALENDAR } };
const listeners = new Set<() => void>();
const emit = (next: Store) => {
  store = next;
  for (const l of listeners) l();
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const calendarColorVar = (c: CalendarColor) => `var(--cal-${c})`;

const defaultOf = (cals: UserCalendar[]) => (cals.find((c) => c.isDefault) ?? cals[0])?.id ?? null;

export const userCalendarActions = {
  update(id: string, patch: Partial<Pick<UserCalendar, "name" | "color">>) {
    emit({ ...store, calendars: store.calendars.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },
  setDefault(id: string) {
    emit({ ...store, calendars: store.calendars.map((c) => ({ ...c, isDefault: c.id === id })) });
  },
  /** 새 캘린더(쓰지 않은 색). 만든 id 를 돌려준다. */
  add(name: string): string {
    const used = new Set(store.calendars.map((c) => c.color));
    const color = CALENDAR_COLORS.find((c) => !used.has(c)) ?? CALENDAR_COLORS[0];
    const id = `cal-${Date.now().toString(36)}`;
    emit({ ...store, calendars: [...store.calendars, { id, name, color, isDefault: false }] });
    return id;
  },
  /** 기본이 아닌 캘린더 삭제. 든 할 일은 기본 캘린더로 옮긴다. */
  remove(id: string) {
    const target = store.calendars.find((c) => c.id === id);
    if (!target || target.isDefault) return;
    const assign = Object.fromEntries(Object.entries(store.assign).filter(([, v]) => v !== id));
    emit({ calendars: store.calendars.filter((c) => c.id !== id), assign });
    calendarFilterActions.forgetCalendar(id);
  },
  assignTodo(todoId: string, calendarId: string) {
    emit({ ...store, assign: { ...store.assign, [todoId]: calendarId } });
  },
};

export interface UserCalendarsApi {
  /** 기능이 꺼져 있으면(실제 모드) false 이고 calendars 는 빈 배열. */
  enabled: boolean;
  calendars: UserCalendar[];
  defaultId: string | null;
  /** 할 일이 든 캘린더. 기능이 꺼져 있으면 null. */
  calendarOf(todo: Pick<Todo, "id" | "seriesId">): UserCalendar | null;
}

export function useUserCalendars(): UserCalendarsApi {
  const enabled = useServerFeature("userCalendars");
  const s = useSyncExternalStore(
    subscribe,
    () => store,
    () => store,
  );
  const calendarOf = useCallback(
    (todo: Pick<Todo, "id" | "seriesId">) => {
      if (!enabled) return null;
      const id = s.assign[todo.id] ?? (todo.seriesId ? s.assign[todo.seriesId] : undefined) ?? defaultOf(s.calendars);
      return s.calendars.find((c) => c.id === id) ?? s.calendars.find((c) => c.isDefault) ?? null;
    },
    [enabled, s],
  );
  if (!enabled) return { enabled, calendars: [], defaultId: null, calendarOf };
  return { enabled, calendars: s.calendars, defaultId: defaultOf(s.calendars), calendarOf };
}
