import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type { Todo } from "@/entities/todo/model/types";
import { collectAllTags, collectRecentTags } from "@/entities/todo/lib/selectors";
import { TaskDetailPanel } from "@/entities/todo/ui/TaskDetailPanel";
import { useTranslation } from "@/shared/lib/i18n";
import { TodoEditorCtx, type TodoEditorApi, type TodoEditorDefaults } from "./useTodoEditor";

type Mode = { kind: "edit"; id: string } | { kind: "new"; defaults: Partial<TodoEditorDefaults> } | null;

export function TodoEditorProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(null);
  const api = useMemo<TodoEditorApi>(
    () => ({
      openTodo: (id) => setMode({ kind: "edit", id }),
      createTodo: (defaults = {}) => setMode({ kind: "new", defaults }),
      close: () => setMode(null),
    }),
    [],
  );
  return (
    <TodoEditorCtx.Provider value={api}>
      {children}
      {mode ? <TodoEditorDialog mode={mode} setMode={setMode} /> : null}
    </TodoEditorCtx.Provider>
  );
}

function TodoEditorDialog({ mode, setMode }: { mode: NonNullable<Mode>; setMode: (m: Mode) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  const close = useCallback(() => setMode(null), [setMode]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const back = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    return () => {
      back?.focus?.();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="te-dlg"
      aria-label={t(mode.kind === "new" ? "shell.todoEditor.new" : "shell.todoEditor.label")}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {mode.kind === "edit" ? (
        <EditBody id={mode.id} onClose={close} onSwitch={(id) => setMode({ kind: "edit", id })} />
      ) : (
        <NewBody defaults={mode.defaults} onClose={close} onCreated={(id) => setMode({ kind: "edit", id })} />
      )}
    </dialog>
  );
}

function EditBody({ id, onClose, onSwitch }: { id: string; onClose: () => void; onSwitch: (id: string) => void }) {
  const {
    state,
    updateTodo,
    updateTodoFollowing,
    setTodoTime,
    updateTodoTimeRecurrence,
    removeTodo,
    updateTodoRecurrence,
    convertTodoToRecurring,
    toggleTodoCalendarLink,
  } = useArchiveApp();
  const { t } = useTranslation();
  const todo = state.todos.find((x) => x.id === id);
  const allTags = useMemo(() => collectAllTags(state.todos), [state.todos]);
  const recentTags = useMemo(() => collectRecentTags(state.todos), [state.todos]);

  // 반복 변경 응답은 base row 라서, 같은 날짜의 새 회차로 선택을 옮긴다.
  const follow = async (mutate: () => Promise<Todo | null>, dateKey: string) => {
    const server = await mutate();
    if (!server) return;
    const match = state.todos.find((x) => x.seriesId === server.id && x.dateKey === dateKey);
    onSwitch(match ? match.id : server.id);
  };

  if (!todo) {
    return (
      <div className="te-empty">
        <p>{t("shell.todoEditor.missing")}</p>
        <button type="button" className="sh-btn" onClick={onClose}>
          {t("shell.close")}
        </button>
      </div>
    );
  }
  const calOn = state.calendar.status === "connected" || state.calendar.status === "needs-reauth";
  return (
    <div className="te-body">
      <TaskDetailPanel
        key={todo.id}
        todo={todo}
        tagSuggestions={allTags}
        recentTags={recentTags}
        onClose={onClose}
        onUpdate={(patch) => updateTodo(todo.id, patch)}
        onUpdateFollowing={(patch) => void follow(() => updateTodoFollowing(todo.id, patch), todo.dateKey)}
        onSetTime={(s, e) => setTodoTime(todo.id, s, e)}
        onSetTimeFollowing={(s, e) => void follow(() => updateTodoTimeRecurrence(todo.id, s, e), todo.dateKey)}
        onDelete={(scope) => {
          removeTodo(todo.id, scope);
          onClose();
        }}
        onUpdateRecurrence={(rule) => void follow(() => updateTodoRecurrence(todo.id, rule), todo.dateKey)}
        onConvertToRecurring={(rule) => void follow(() => convertTodoToRecurring(todo.id, rule), todo.dateKey)}
        onToggleCalendarLink={calOn ? () => toggleTodoCalendarLink(todo.id) : undefined}
        calendarNeedsReauth={state.calendar.status === "needs-reauth"}
      />
    </div>
  );
}

function NewBody({
  defaults,
  onClose,
  onCreated,
}: {
  defaults: Partial<TodoEditorDefaults>;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { addTodo, setTodoTime } = useArchiveApp();
  const { t } = useTranslation();
  const today = useTodayKey();
  const [title, setTitle] = useState("");
  const submit = () => {
    const v = title.trim();
    if (!v) return;
    addTodo(v, defaults.dateKey ?? today, undefined, (id) => {
      if (defaults.startTime) setTodoTime(id, defaults.startTime, defaults.endTime ?? null);
      onCreated(id);
    });
  };
  return (
    <form
      className="te-new"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h2>{t("shell.todoEditor.new")}</h2>
      <input
        autoFocus
        className="te-in"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("shell.todoEditor.titlePlaceholder")}
        aria-label={t("shell.todoEditor.titlePlaceholder")}
        maxLength={200}
      />
      <div className="te-ft">
        <button type="button" className="sh-btn" onClick={onClose}>
          {t("shell.todoEditor.cancel")}
        </button>
        <button type="submit" className="sh-btn sh-btn-p" disabled={!title.trim()}>
          {t("shell.todoEditor.create")}
        </button>
      </div>
    </form>
  );
}
