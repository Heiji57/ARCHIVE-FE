import { memo, type PointerEvent } from "react";
import type { Todo } from "@/entities/todo/model/types";
import { HOUR_H, PX_PER_MIN, type PlacedEvent } from "../model/grid";
import { formatClock } from "../model/eventInfo";
import { CalendarOverlaySlot } from "./CalendarOverlaySlot";
import { EventCard } from "./EventCard";

export interface DayTimelineProps {
  dateKey: string;
  events: PlacedEvent[];
  isToday: boolean;
  past: boolean;
  weekend: boolean;
  /** 지금 시각(분). 오늘이면 진한 선, faintNow 면 같은 주의 다른 날에 옅은 선. */
  nowMin: number;
  faintNow: boolean;
  over: boolean;
  draggingId: string | null;
  /** 빈 칸을 끄는 중인 새 할 일 범위(분). */
  creating: { start: number; end: number } | null;
  onOpen(id: string): void;
  onStartMove(e: PointerEvent<HTMLElement>, todo: Todo): void;
  onStartResize(e: PointerEvent<HTMLElement>, todo: Todo): void;
  onStartCreate(e: PointerEvent<HTMLElement>): void;
}

/** 하루 시간 칸(시안 .ng-col): 시간 줄, 할 일 블록(카드 6번), 지금 선, 흐린 칸 자리. 빈 곳을 누르거나 끌면 새 할 일. */
export const DayTimeline = memo(function DayTimeline({
  dateKey,
  events,
  isToday,
  past,
  weekend,
  nowMin,
  faintNow,
  over,
  draggingId,
  creating,
  onOpen,
  onStartMove,
  onStartResize,
  onStartCreate,
}: DayTimelineProps) {
  const y = nowMin * PX_PER_MIN;
  return (
    <div
      className={`cal-col${weekend ? " we" : ""}${past ? " past" : ""}${over ? " drop" : ""}`}
      data-lane={dateKey}
      onPointerDown={(e) => {
        if (e.target !== e.currentTarget) return;
        onStartCreate(e);
      }}
    >
      {events.map((p) => (
        <EventCard
          key={p.todo.id}
          todo={p.todo}
          variant="week"
          layout={{ top: p.top, height: p.height, lane: p.lane, lanes: p.lanes }}
          dragging={draggingId === p.todo.id}
          onOpen={onOpen}
          onPointerDown={onStartMove}
          onResizeStart={onStartResize}
        />
      ))}
      <CalendarOverlaySlot dateKey={dateKey} variant="week" />
      {creating ? (
        <div
          className="cal-new"
          style={{ top: creating.start * PX_PER_MIN, height: Math.max(12, (creating.end - creating.start) * PX_PER_MIN) }}
          aria-hidden="true"
        >
          {formatClock(creating.start)} ~ {formatClock(creating.end)}
        </div>
      ) : null}
      {isToday ? <div className="cal-nl" style={{ top: y }} aria-hidden="true" /> : null}
      {!isToday && faintNow ? <div className="cal-nl faint" style={{ top: y }} aria-hidden="true" /> : null}
    </div>
  );
});

/** 시간 칸 왼쪽 시각 열(1 AM ~ 11 PM). */
export function TimeGutter() {
  return (
    <div className="cal-gut" aria-hidden="true">
      {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
        <span key={h} style={{ top: h * HOUR_H }}>
          {formatClock(h * 60, true)}
        </span>
      ))}
    </div>
  );
}
