import { useCallback, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import type { Todo } from "@/entities/todo/model/types";
import { useLatestRef } from "@/shared/lib/useLatestRef";
import { addDaysKey, daysBetween, isMultiDay } from "./eventInfo";
import { PX_PER_MIN, SNAP, clampMin, snapMin, timesOf } from "./grid";
import { MINUTES_IN_DAY, formatTime } from "./timeline";

/**
 * 캘린더 끌어 놓기(포인터). 놓을 곳은 DOM 속성으로 찾는다.
 * - [data-lane="YYYY-MM-DD"]: 하루 시간 칸. 날짜와 시각이 바뀐다(길이 유지).
 * - [data-adg][data-adg-start][data-adg-n]: 주간 종일 줄. 그 열의 날짜로, 시간은 빠진다.
 * - [data-drop="YYYY-MM-DD"]: 날짜 머리, 월간 칸. 날짜만 바뀐다.
 * 기간 할 일은 시작과 마감을 같은 날 수만큼 함께 옮긴다. 움직이지 않고 떼면 연다.
 * 빈 시간 칸을 누르거나 끌면 그 시간으로 새 할 일.
 */

const THRESHOLD = 4;

export interface TodoChange {
  id: string;
  dateKey: string;
  dueDate: string | null;
  startTime: string | null;
  endTime: string | null;
}

export interface CreateRange {
  dateKey: string;
  startTime: string;
  endTime: string;
}

export interface DragPreview {
  /** 끄는 중인 할 일을 바꾼 모양(같은 id). */
  todo: Todo | null;
  /** 빈 칸을 끄는 중이면 만들 범위. */
  create: { dateKey: string; start: number; end: number } | null;
  /** 놓일 곳 강조(data-lane / data-drop 날짜). */
  over: string | null;
}

interface Session {
  mode: "move" | "resize" | "create";
  todo: Todo | null;
  x0: number;
  y0: number;
  moved: boolean;
  /** move: 블록 안에서 잡은 곳(분). */
  grab: number;
  /** create: 시작 칸과 시작 분. */
  lane?: HTMLElement;
  startMin?: number;
  last: DragPreview | null;
}

const minuteIn = (el: HTMLElement, y: number) => (y - el.getBoundingClientRect().top) / PX_PER_MIN;

function targetAt(x: number, y: number) {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el) return null;
  const lane = el.closest<HTMLElement>("[data-lane]");
  if (lane) return { kind: "lane" as const, el: lane, date: lane.dataset.lane! };
  const adg = el.closest<HTMLElement>("[data-adg]");
  if (adg) {
    const r = adg.getBoundingClientRect();
    const n = Number(adg.dataset.adgN);
    const col = Math.max(0, Math.min(n - 1, Math.floor(((x - r.left) / r.width) * n)));
    return { kind: "allday" as const, el: adg, date: addDaysKey(adg.dataset.adgStart!, col) };
  }
  const drop = el.closest<HTMLElement>("[data-drop]");
  if (drop) return { kind: "drop" as const, el: drop, date: drop.dataset.drop! };
  return null;
}

function shift(todo: Todo, date: string): Pick<Todo, "dateKey" | "dueDate"> {
  if (isMultiDay(todo)) {
    const d = daysBetween(todo.dateKey, date);
    return { dateKey: date, dueDate: addDaysKey(todo.dueDate!, d) };
  }
  return { dateKey: date, dueDate: todo.dueDate ?? null };
}

export function useCalendarDrag(opts: {
  onCommit(change: TodoChange, original: Todo): void;
  onOpen(id: string): void;
  onCreate(range: CreateRange): void;
}) {
  const [preview, setPreview] = useState<DragPreview | null>(null);
  const ses = useRef<Session | null>(null);
  const optsRef = useLatestRef(opts);

  const compute = useCallback((s: Session, x: number, y: number): DragPreview | null => {
    if (s.mode === "create") {
      const lane = s.lane!;
      const m = clampMin(snapMin(minuteIn(lane, y)));
      const a = Math.min(s.startMin!, m);
      const b = Math.max(s.startMin! + SNAP * 2, m);
      return { todo: null, create: { dateKey: lane.dataset.lane!, start: a, end: Math.min(MINUTES_IN_DAY, b) }, over: null };
    }
    const todo = s.todo!;
    const tm = timesOf(todo);
    if (s.mode === "resize") {
      const lane = (document.querySelector(`[data-lane="${todo.dateKey}"]`) as HTMLElement | null) ?? null;
      if (!lane || !tm) return null;
      const end = Math.max(tm.start + SNAP, clampMin(snapMin(minuteIn(lane, y))));
      return { todo: { ...todo, endTime: formatTime(end) }, create: null, over: null };
    }
    const tg = targetAt(x, y);
    if (!tg) return s.last;
    if (tg.kind === "lane" && !isMultiDay(todo)) {
      const dur = tm ? tm.end - tm.start : 60;
      const start = Math.max(0, Math.min(MINUTES_IN_DAY - dur, snapMin(minuteIn(tg.el, y) - s.grab)));
      return {
        todo: { ...todo, dateKey: tg.date, startTime: formatTime(start), endTime: formatTime(start + dur) },
        create: null,
        over: tg.date,
      };
    }
    if (tg.kind === "allday") {
      return {
        todo: { ...todo, ...shift(todo, tg.date), startTime: null, endTime: null },
        create: null,
        over: tg.date,
      };
    }
    return { todo: { ...todo, ...shift(todo, tg.date) }, create: null, over: tg.date };
  }, []);

  const begin = useCallback(
    (s: Session, e: RPointerEvent<HTMLElement>) => {
      ses.current = s;
      const move = (ev: PointerEvent) => {
        const cur = ses.current;
        if (!cur) return;
        if (!cur.moved && Math.max(Math.abs(ev.clientX - cur.x0), Math.abs(ev.clientY - cur.y0)) < THRESHOLD) return;
        cur.moved = true;
        const p = compute(cur, ev.clientX, ev.clientY);
        cur.last = p;
        setPreview(p);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        const cur = ses.current;
        ses.current = null;
        setPreview(null);
        if (!cur) return;
        const o = optsRef.current;
        if (cur.mode === "create") {
          const c = cur.last?.create;
          if (cur.moved && c) o.onCreate({ dateKey: c.dateKey, startTime: formatTime(c.start), endTime: formatTime(c.end) });
          else {
            const start = Math.min(MINUTES_IN_DAY - 60, Math.floor(cur.startMin! / 30) * 30);
            o.onCreate({ dateKey: cur.lane!.dataset.lane!, startTime: formatTime(start), endTime: formatTime(start + 60) });
          }
          return;
        }
        if (!cur.moved) {
          if (cur.mode === "move") o.onOpen(cur.todo!.id);
          return;
        }
        const t = cur.last?.todo;
        const a = cur.todo!;
        if (!t) return;
        if (
          t.dateKey === a.dateKey &&
          (t.dueDate ?? null) === (a.dueDate ?? null) &&
          (t.startTime ?? null) === (a.startTime ?? null) &&
          (t.endTime ?? null) === (a.endTime ?? null)
        )
          return;
        o.onCommit(
          { id: a.id, dateKey: t.dateKey, dueDate: t.dueDate ?? null, startTime: t.startTime ?? null, endTime: t.endTime ?? null },
          a,
        );
      };
      const cancel = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        ses.current = null;
        setPreview(null);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      e.preventDefault();
    },
    [compute, optsRef],
  );

  const startMove = useCallback(
    (e: RPointerEvent<HTMLElement>, todo: Todo) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const lane = (e.currentTarget.closest("[data-lane]") as HTMLElement | null) ?? null;
      const tm = timesOf(todo);
      const grab = lane && tm ? minuteIn(lane, e.clientY) - tm.start : 0;
      begin({ mode: "move", todo, x0: e.clientX, y0: e.clientY, moved: false, grab, last: null }, e);
    },
    [begin],
  );

  const startResize = useCallback(
    (e: RPointerEvent<HTMLElement>, todo: Todo) => {
      if (e.button !== 0) return;
      begin({ mode: "resize", todo, x0: e.clientX, y0: e.clientY, moved: false, grab: 0, last: null }, e);
    },
    [begin],
  );

  /** 빈 시간 칸에서 누르기 시작. */
  const startCreate = useCallback(
    (e: RPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      const lane = e.currentTarget;
      const startMin = clampMin(Math.floor(minuteIn(lane, e.clientY) / SNAP) * SNAP);
      begin({ mode: "create", todo: null, x0: e.clientX, y0: e.clientY, moved: false, grab: 0, lane, startMin, last: null }, e);
    },
    [begin],
  );

  return { preview, startMove, startResize, startCreate };
}

/** 끄는 중이면 그 할 일을 미리보기 모양으로 바꾼 목록. */
export function applyPreview(todos: Todo[], preview: DragPreview | null): Todo[] {
  const t = preview?.todo;
  if (!t) return todos;
  return todos.map((x) => (x.id === t.id ? t : x));
}
