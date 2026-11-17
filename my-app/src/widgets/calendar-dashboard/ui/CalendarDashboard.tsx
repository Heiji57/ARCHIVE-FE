import { useCallback, useEffect, useMemo, useRef } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useNowMinutes } from "@/app/providers/useToday";
import type { Todo } from "@/entities/todo/model/types";
import { useRegisterPaletteCommand } from "@/widgets/global-search";
import { useTodoEditor } from "@/widgets/todo-editor";
import { passesFilter, useCalendarFilter } from "../model/calendarFilter";
import { addDaysKey, daysBetween } from "../model/eventInfo";
import { applyPreview, useCalendarDrag, type TodoChange } from "../model/useCalendarDrag";
import type { CalendarController } from "../model/useCalendarController";
import { userCalendarActions, useUserCalendars } from "../model/userCalendars";
import { MonthGrid } from "./MonthGrid";
import { WeekGrid } from "./WeekGrid";

/** 서버 목록 조회 한 번의 최대 범위(일). */
const MAX_RANGE = 62;

/**
 * 캘린더 본문(주간, 일간, 월간). 페이지가 useCalendarController 로 만든 ctl 을 사이드바, 도구 막대와 같이 넘긴다.
 * 할 일을 누르면 할 일 창(useTodoEditor), 빈 칸을 누르거나 끌면 그 시간으로 새 할 일.
 */
export function CalendarDashboard({ ctl }: { ctl: CalendarController }) {
  const { state, moveTodo, updateTodo, setTodoTime, loadTodosForView, focusTarget, clearFocus } = useArchiveApp();
  const editor = useTodoEditor();
  const filter = useCalendarFilter();
  const { calendarOf, defaultId } = useUserCalendars();
  const nowMin = useNowMinutes();

  const visible = useMemo(
    () => state.todos.filter((td) => passesFilter(td, filter, calendarOf(td)?.id ?? null)),
    [state.todos, filter, calendarOf],
  );

  const commit = useCallback(
    (c: TodoChange, a: Todo) => {
      const dueChanged = (a.dueDate ?? null) !== c.dueDate;
      if (dueChanged) updateTodo(a.id, { dateKey: c.dateKey, dueDate: c.dueDate });
      else if (c.dateKey !== a.dateKey) moveTodo(a.id, c.dateKey);
      if ((a.startTime ?? null) !== c.startTime || (a.endTime ?? null) !== c.endTime) setTodoTime(a.id, c.startTime, c.endTime);
    },
    [updateTodo, moveTodo, setTodoTime],
  );
  const drag = useCalendarDrag({
    onCommit: commit,
    onOpen: editor.openTodo,
    onCreate: (r) => editor.createTodo(r),
  });
  const todos = useMemo(() => applyPreview(visible, drag.preview), [visible, drag.preview]);

  const retroDays = useMemo(
    () => new Set(state.entries.filter((e) => e.retroType === "daily" && !e.isSummary).map((e) => e.dateKey)),
    [state.entries],
  );

  // 보이는 범위가 불러온 범위를 벗어나면 다시 불러온다(서버 62일 제한, hydrate 는 목록을 통째로 바꿈).
  const loaded = useRef<{ from: string; to: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const onVisibleRange = useCallback(
    (from: string, to: string) => {
      const l = loaded.current;
      if (l && from >= l.from && to <= l.to) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const span = daysBetween(from, to) + 1;
        const pad = Math.max(0, Math.floor((MAX_RANGE - span) / 2));
        const range = { from: addDaysKey(from, -pad), to: addDaysKey(to, Math.min(pad, MAX_RANGE - span - pad)) };
        loaded.current = range;
        void loadTodosForView(range.from, range.to);
      }, 250);
    },
    [loadTodosForView],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // 새로 만든 할 일은 기본 캘린더에(데모의 사용자 캘린더). 할 일 창이 만든 id 를 모르므로 처음 보이는 id 를 배정.
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!defaultId) return;
    if (!known.current) {
      known.current = new Set(state.todos.map((td) => td.id));
      return;
    }
    for (const td of state.todos) {
      if (known.current.has(td.id)) continue;
      known.current.add(td.id);
      userCalendarActions.assignTodo(td.id, defaultId);
    }
  }, [state.todos, defaultId]);

  // 검색에서 할 일을 고르면: 그 날짜로 옮기고 할 일 창을 연다.
  useEffect(() => {
    if (focusTarget?.kind !== "todo") return;
    ctl.pick(focusTarget.dateKey, { force: true });
    editor.openTodo(focusTarget.todoId);
    clearFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget]);

  // 단축키: t 오늘, j/k 다음/이전(입력칸, 창이 열려 있으면 무시)
  const ctlRef = useRef(ctl);
  useEffect(() => {
    ctlRef.current = ctl;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tg = e.target as HTMLElement | null;
      if (tg?.closest("input, textarea, select, [contenteditable=true], dialog") || document.querySelector("dialog[open]")) return;
      const k = e.key.toLowerCase();
      if (k === "t") ctlRef.current.goToday();
      else if (k === "j") ctlRef.current.step(1);
      else if (k === "k") ctlRef.current.step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useRegisterPaletteCommand({ id: "cal.today", labelKey: "cal.palette.today", hint: "T", order: 20, run: () => ctl.goToday() });
  useRegisterPaletteCommand({ id: "cal.week", labelKey: "cal.palette.week", order: 30, run: () => ctl.setView("week") });
  useRegisterPaletteCommand({ id: "cal.month", labelKey: "cal.palette.month", order: 40, run: () => ctl.setView("month") });

  return (
    <div className="cal-root" data-dragging={drag.preview ? "" : undefined}>
      {ctl.view === "month" ? (
        <MonthGrid
          ctl={ctl}
          todos={todos}
          drag={drag}
          preview={drag.preview}
          retroDays={retroDays}
          onOpen={editor.openTodo}
          onCreate={(dateKey) => editor.createTodo({ dateKey })}
          onVisibleRange={onVisibleRange}
        />
      ) : (
        <WeekGrid
          ctl={ctl}
          todos={todos}
          drag={drag}
          preview={drag.preview}
          retroDays={retroDays}
          nowMin={nowMin}
          onOpen={editor.openTodo}
          onVisibleRange={onVisibleRange}
        />
      )}
    </div>
  );
}
