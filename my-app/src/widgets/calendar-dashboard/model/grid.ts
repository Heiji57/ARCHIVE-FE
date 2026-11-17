import type { Todo } from "@/entities/todo/model/types";
import { isMultiDay } from "./eventInfo";
import { MINUTES_IN_DAY, assignLanes, parseTime } from "./timeline";

/** 시간 칸 한 시간 높이(px). 시안 A.HH. */
export const HOUR_H = 48;
export const PX_PER_MIN = HOUR_H / 60;
/** 끌기·빈 칸 만들기 단위(분). */
export const SNAP = 15;
/** 시간 칸 왼쪽 시각 열 너비. */
export const GUTTER_W = 56;

export const snapMin = (m: number) => Math.round(m / SNAP) * SNAP;
export const clampMin = (m: number) => Math.max(0, Math.min(MINUTES_IN_DAY, m));

/** 할 일의 시작·끝(분). 시간 없으면 null. 끝이 없거나 시작보다 앞이면 시작 + 1시간. */
export function timesOf(todo: Todo): { start: number; end: number } | null {
  const s = parseTime(todo.startTime);
  if (s === null) return null;
  const e = parseTime(todo.endTime);
  return { start: s, end: Math.min(MINUTES_IN_DAY, e !== null && e > s ? e : s + 60) };
}

/** 시간 칸에 놓이는 할 일인지(시간이 있고 기간 할 일이 아님). */
export const isTimed = (t: Todo) => !isMultiDay(t) && timesOf(t) !== null;

export interface PlacedEvent {
  todo: Todo;
  top: number;
  height: number;
  lane: number;
  lanes: number;
}

/** 하루 시간 칸 배치(시안 P.ev: top = 시작 + 1px, 높이 = 길이 - 3px, 최소 20px). 겹치면 열로 나눈다. */
export function placeDay(todos: Todo[]): PlacedEvent[] {
  const items = todos
    .map((todo) => ({ todo, t: timesOf(todo)! }))
    .filter((x) => x.t)
    .sort((a, b) => a.t.start - b.t.start || a.t.end - b.t.end);
  const lanes = assignLanes(items.map((x) => ({ startMin: x.t.start, endMin: Math.max(x.t.end, x.t.start + 30) })));
  return items.map((x, i) => ({
    todo: x.todo,
    top: x.t.start * PX_PER_MIN + 1,
    height: Math.max((x.t.end - x.t.start) * PX_PER_MIN - 3, 20),
    lane: lanes[i].lane,
    lanes: lanes[i].lanes,
  }));
}
