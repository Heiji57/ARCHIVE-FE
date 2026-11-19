import { useLayoutEffect, useMemo, useRef } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useNowMinutes, useTodayKey } from "@/app/providers/useToday";
import { useTodoEditor } from "@/widgets/todo-editor";
import { passesFilter, useCalendarFilter } from "../model/calendarFilter";
import { isMultiDay, isOnDay } from "../model/eventInfo";
import { HOUR_H, isTimed, placeDay, timesOf } from "../model/grid";
import { applyPreview } from "../model/useCalendarDrag";
import { useTodoDrag } from "../model/useTodoDrag";
import { useUserCalendars } from "../model/userCalendars";
import { DayTimeline, TimeGutter } from "./DayTimeline";
import { EventCard } from "./EventCard";

/**
 * 하루 시간표(시안 planner.js dayView: 종일 줄 + 시간 칸 한 열). 할 일 화면 오른쪽 패널의 "시간표" 탭.
 * 캘린더와 같은 거르기, 카드, 끌어 놓기(보드 카드를 끌어 와 시간 칸에 놓으면 시간이 잡힘).
 */
export function DaySchedule({ dateKey }: { dateKey: string }) {
  const { state } = useArchiveApp();
  const filter = useCalendarFilter();
  const { calendarOf } = useUserCalendars();
  const todayKey = useTodayKey();
  const nowMin = useNowMinutes();
  const drag = useTodoDrag();
  const editor = useTodoEditor();
  const scrollRef = useRef<HTMLDivElement>(null);

  const todos = useMemo(
    () =>
      applyPreview(
        state.todos.filter((td) => passesFilter(td, filter, calendarOf(td)?.id ?? null)),
        drag.preview,
      ),
    [state.todos, filter, calendarOf, drag.preview],
  );
  const timed = useMemo(() => placeDay(todos.filter((td) => td.dateKey === dateKey && isTimed(td))), [todos, dateKey]);
  const allday = useMemo(
    () => todos.filter((td) => isOnDay(td, dateKey) && (isMultiDay(td) || !timesOf(td))),
    [todos, dateKey],
  );

  // 처음 열 때 지금 두 시간 전(다른 날은 오전 7시)이 위에 오게
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const top = dateKey === todayKey ? Math.max(0, nowMin / 60 - 2) : 7;
    el.scrollTop = top * HOUR_H + (el.querySelector<HTMLElement>(".cal-d1-ad")?.offsetHeight ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const draggingId = drag.preview?.todo?.id ?? null;
  return (
    <div ref={scrollRef} className="cal-d1" data-dragging={drag.preview ? "" : undefined}>
      {allday.length ? (
        <div className="cal-d1-ad" data-adg="" data-adg-start={dateKey} data-adg-n={1}>
          {allday.map((td) => (
            <EventCard
              key={td.id}
              todo={td}
              variant="allday"
              cut={isMultiDay(td) ? { left: td.dateKey < dateKey, right: td.dueDate! > dateKey } : undefined}
              dragging={draggingId === td.id}
              onOpen={editor.openTodo}
              onPointerDown={drag.startMove}
            />
          ))}
        </div>
      ) : null}
      <div className="cal-d1-g">
        <TimeGutter />
        <DayTimeline
          dateKey={dateKey}
          events={timed}
          isToday={dateKey === todayKey}
          past={dateKey < todayKey}
          weekend={false}
          nowMin={nowMin}
          faintNow={false}
          over={drag.preview?.over === dateKey && !!drag.preview.todo?.startTime}
          draggingId={draggingId}
          creating={drag.preview?.create?.dateKey === dateKey ? drag.preview.create : null}
          onOpen={editor.openTodo}
          onStartMove={drag.startMove}
          onStartResize={drag.startResize}
          onStartCreate={drag.startCreate}
        />
      </div>
    </div>
  );
}
