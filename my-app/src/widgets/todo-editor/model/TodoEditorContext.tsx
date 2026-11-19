import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ArchiveAppContextValue } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { Todo } from "@/entities/todo/model/types";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { NewTodoDialog } from "../ui/NewTodoDialog";
import { TodoModal } from "../ui/TodoModal";
import { defaultCalendar, type EditorCalendar } from "./calendars";
import type { EditorEnv } from "./editorEnv";
import { TodoEditorCtx, type TodoEditorApi, type TodoEditorDefaults } from "./useTodoEditor";

const NO_CALENDARS: EditorCalendar[] = [];

type Mode = { kind: "edit"; id: string } | { kind: "new"; defaults: Partial<TodoEditorDefaults> } | null;

export interface TodoEditorProviderProps {
  children: ReactNode;
  /**
   * 사용자 캘린더 목록(`useServerFeature("userCalendars")` 일 때만 보임).
   * App 의 TodoEditorHost 가 캘린더 사이드바와 같은 목록(`useUserCalendars`)을 넘긴다. 안 주면 캘린더 줄이 없다.
   */
  calendars?: EditorCalendar[];
  /** 할 일의 캘린더 id. 안 주거나 null 이면 이 창에서 고른 값, 그것도 없으면 기본 캘린더. */
  calendarOf?: (todo: Todo) => string | null;
  /** 할 일의 캘린더를 바꿨을 때. 안 주면 이 위젯 안에만 기억한다(데모). */
  onCalendarChange?: (todoId: string, calendarId: string) => void;
  /** 설정 시트 열기(Google 캘린더 연결 메뉴). */
  onOpenSettings?: (section: SettingsSection) => void;
}

/**
 * 할 일 모달(26번)과 새 할 일 창(3번)을 띄운다. 페이지는 `useTodoEditor()` 로 연다.
 */
export function TodoEditorProvider({
  children,
  calendars = NO_CALENDARS,
  calendarOf,
  onCalendarChange,
  onOpenSettings,
}: TodoEditorProviderProps) {
  const app = useArchiveApp();
  const [mode, setMode] = useState<Mode>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const pending = useRef(new Map<string, (app: ArchiveAppContextValue) => void>());

  // 새 할 일이 목록에 들어온 뒤(데모는 바로, 실제는 서버 응답 뒤) 시간대, 마감일을 이어서 적는다.
  // 그때의 앱 값을 써야 setTodoTime 이 새 할 일을 찾는다.
  useEffect(() => {
    if (!pending.current.size) return;
    for (const [id, run] of pending.current) {
      if (app.state.todos.some((x) => x.id === id)) {
        pending.current.delete(id);
        run(app);
      }
    }
  }, [app]);

  const api = useMemo<TodoEditorApi>(
    () => ({
      openTodo: (id) => setMode({ kind: "edit", id }),
      createTodo: (defaults = {}) => setMode({ kind: "new", defaults }),
      close: () => setMode(null),
    }),
    [],
  );

  const setCalendar = useCallback(
    (todoId: string, calendarId: string) => {
      setPicked((m) => ({ ...m, [todoId]: calendarId }));
      onCalendarChange?.(todoId, calendarId);
    },
    [onCalendarChange],
  );

  const env = useMemo<EditorEnv>(
    () => ({
      calendars,
      calendarIdOf: (todo) => calendarOf?.(todo) ?? picked[todo.id] ?? defaultCalendar(calendars)?.id ?? "",
      setCalendar,
      openSettings: onOpenSettings,
      afterCreate: (id, run) => {
        pending.current.set(id, run);
      },
    }),
    [calendars, calendarOf, picked, setCalendar, onOpenSettings],
  );

  const close = useCallback(() => setMode(null), []);

  return (
    <TodoEditorCtx.Provider value={api}>
      {children}
      {mode?.kind === "edit" ? (
        <TodoModal key={mode.id} todoId={mode.id} env={env} onClose={close} onSwitch={(id) => setMode({ kind: "edit", id })} />
      ) : mode?.kind === "new" ? (
        <NewTodoDialog env={env} defaults={mode.defaults} onClose={close} />
      ) : null}
    </TodoEditorCtx.Provider>
  );
}
