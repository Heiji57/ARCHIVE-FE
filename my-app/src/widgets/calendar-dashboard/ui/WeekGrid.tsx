import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Bookmark } from "lucide-react";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { fromDateKey } from "@/shared/lib/date";
import { addDaysKey, daysBetween, isMultiDay, isOnDay } from "../model/eventInfo";
import { fmtLongDay, fmtMonthShort, formatKey, gmtLabel } from "../model/dateFormat";
import { GUTTER_W, HOUR_H, isTimed, placeDay, timesOf } from "../model/grid";
import type { DragPreview, useCalendarDrag } from "../model/useCalendarDrag";
import { setCalendarViewport, type CalendarController } from "../model/useCalendarController";
import { weekStartOf } from "../model/weekDays";
import { CalendarOverlaySlot } from "./CalendarOverlaySlot";
import { DayTimeline, TimeGutter } from "./DayTimeline";
import { EventCard } from "./EventCard";

export interface WeekGridProps {
  ctl: CalendarController;
  /** 거르기를 통과하고 끌기 미리보기를 반영한 할 일. */
  todos: Todo[];
  drag: ReturnType<typeof useCalendarDrag>;
  preview: DragPreview | null;
  retroDays: ReadonlySet<string>;
  nowMin: number;
  onOpen(id: string): void;
  onVisibleRange(from: string, to: string): void;
}

/**
 * 주간과 일간(시안 d-calendar.html: Notion Calendar 구조). 날짜 열이 옆으로 끝없이 이어지고
 * (끝에 닿으면 4주씩 늘림) 위에 날짜 머리와 종일 줄이 붙어 있다. 일간은 같은 구조에서 한 열이 화면 하나.
 */
export function WeekGrid({ ctl, todos, drag, preview, retroDays, nowMin, onOpen, onVisibleRange }: WeekGridProps) {
  const { t, locale } = useTranslation();
  const day = ctl.view === "day";
  const { start, n } = ctl.weekRange;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const cw = width ? (day ? Math.max(280, width - GUTTER_W) : Math.max(128, Math.floor((width - GUTTER_W) / 7))) : 140;

  const days = useMemo(() => Array.from({ length: n }, (_, i) => addDaysKey(start, i)), [start, n]);
  const first = days[0];
  const last = days[days.length - 1];
  const todayWeek = weekStartOf(ctl.todayKey, ctl.weekStart);

  const timedByDay = useMemo(() => {
    const m = new Map<string, Todo[]>();
    for (const td of todos) {
      if (!isTimed(td)) continue;
      if (td.dateKey < first || td.dateKey > last) continue;
      const l = m.get(td.dateKey) ?? [];
      l.push(td);
      m.set(td.dateKey, l);
    }
    return m;
  }, [todos, first, last]);

  const placedByDay = useMemo(() => {
    const m = new Map<string, ReturnType<typeof placeDay>>();
    for (const [d, l] of timedByDay) m.set(d, placeDay(l));
    return m;
  }, [timedByDay]);
  const noEvents = useMemo(() => [] as ReturnType<typeof placeDay>, []);

  const allday = useMemo(
    () =>
      todos
        .filter((td) => (isMultiDay(td) || !timesOf(td)) && td.dateKey <= last && (td.dueDate && isMultiDay(td) ? td.dueDate : td.dateKey) >= first)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || (isMultiDay(b) ? 1 : 0) - (isMultiDay(a) ? 1 : 0)),
    [todos, first, last],
  );

  /* ---------- 크기와 스크롤 ---------- */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pendingShift = useRef(0);
  const extending = useRef(false);
  const col = useRef<number | null>(null);
  const tick = useRef(false);
  const ctlRef = useRef(ctl);
  const cwRef = useRef(cw);
  useEffect(() => {
    ctlRef.current = ctl;
    cwRef.current = cw;
  });

  // 앞쪽으로 늘린 만큼 스크롤 위치를 옮겨 보던 날짜를 유지
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingShift.current) {
      el.scrollLeft += pendingShift.current * cw;
      pendingShift.current = 0;
    }
    extending.current = false;
  }, [start, n, cw]);

  // 폭이 바뀌면 보던 열 유지
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && col.current !== null) el.scrollLeft = Math.round(col.current * cw);
  }, [cw]);

  const report = () => {
    const el = scrollRef.current;
    if (!el) return;
    const c = ctlRef.current;
    const w = cwRef.current;
    const sl = el.scrollLeft;
    col.current = sl / w;
    const vis = day ? 1 : Math.max(1, Math.floor((el.clientWidth - GUTTER_W) / w));
    const i0 = day ? Math.round(sl / w) : Math.floor((sl + 2) / w);
    const s0 = c.weekRange.start;
    const ti = daysBetween(s0, c.todayKey);
    setCalendarViewport({
      anchor: addDaysKey(s0, day ? i0 : Math.floor((sl + 1) / w) + 3),
      todayDir: ti < i0 ? "left" : ti > i0 + vis - 1 ? "right" : "in",
    });
    onVisibleRange(addDaysKey(s0, i0), addDaysKey(s0, i0 + vis - 1));
  };

  // 이동 요청: 고른 날짜(주간은 그 주 첫날)로
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const c = ctlRef.current;
    const i = daysBetween(c.weekRange.start, c.date);
    const visible = i * cw >= el.scrollLeft - 1 && (i + 1) * cw <= el.scrollLeft + el.clientWidth - GUTTER_W + 1;
    if (c.jump.force || !visible) {
      el.scrollLeft = (day ? i : daysBetween(c.weekRange.start, weekStartOf(c.date, c.weekStart))) * cw;
    }
    if (!el.dataset.y) {
      el.scrollTop = 8.5 * HOUR_H;
      el.dataset.y = "1";
    }
    report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctl.jump.seq, day, width > 0]);

  const onScroll = () => {
    if (tick.current) return;
    tick.current = true;
    requestAnimationFrame(() => {
      tick.current = false;
      const el = scrollRef.current;
      if (!el) return;
      const w = cwRef.current;
      if (!extending.current) {
        if (el.scrollLeft < w * 7) {
          extending.current = true;
          pendingShift.current += ctlRef.current.extend("week", -1);
        } else if (el.scrollLeft + el.clientWidth > el.scrollWidth - w * 7) {
          extending.current = true;
          ctlRef.current.extend("week", 1);
        }
      }
      report();
    });
  };

  /* ---------- 그리기 ---------- */
  const draggingId = preview?.todo?.id ?? null;
  const weekendOf = (d: string) => {
    const w = fromDateKey(d).getDay();
    return w === 0 ? "we sun" : w === 6 ? "we sat" : "";
  };

  return (
    <div
      ref={scrollRef}
      className={`cal-scroll${day ? " dayv" : ""}`}
      style={{ "--cw": `${cw}px` } as CSSProperties}
      onScroll={onScroll}
      tabIndex={-1}
    >
      <div className="cal-wk" style={{ "--n": n } as CSSProperties}>
        <div className="cal-wtop">
          <div className="cal-wrow">
            <div className="cal-corner cal-tz">{gmtLabel()}</div>
            {days.map((d) => {
              const x = fromDateKey(d);
              const cls = [
                "cal-dh",
                weekendOf(d),
                d === ctl.todayKey ? "today" : "",
                d < ctl.todayKey ? "past" : "",
                d === ctl.date ? "sel" : "",
                preview?.over === d && !preview.todo?.startTime ? "drop" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div key={d} className={cls} data-drop={d}>
                  <button type="button" aria-label={fmtLongDay(locale, d)} onClick={() => ctl.pick(d)}>
                    <span className="cal-dw">
                      {x.getDate() === 1 || day ? <b>{fmtMonthShort(locale, d)}</b> : null}
                      {formatKey(locale, d, { weekday: day ? "long" : "short" })}
                      {retroDays.has(d) ? (
                        <span className="cal-bm" title={t("cal.retroMark")}>
                          <Bookmark size={11} aria-label={t("cal.retroMark")} />
                        </span>
                      ) : null}
                    </span>
                    <span className="cal-dn">{x.getDate()}</span>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="cal-wrow ad">
            <div className="cal-corner cal-lb">{t("cal.allday")}</div>
            <div className="cal-adg" data-adg="" data-adg-start={first} data-adg-n={n}>
              {allday.map((td) => {
                if (isMultiDay(td)) {
                  const a = td.dateKey < first ? 0 : daysBetween(first, td.dateKey);
                  const b = td.dueDate! > last ? n - 1 : daysBetween(first, td.dueDate!);
                  return (
                    <EventCard
                      key={td.id}
                      todo={td}
                      variant="allday"
                      cut={{ left: td.dateKey < first, right: td.dueDate! > last }}
                      style={{ gridColumn: `${a + 1} / ${b + 2}` }}
                      dragging={draggingId === td.id}
                      onOpen={onOpen}
                      onPointerDown={drag.startMove}
                    />
                  );
                }
                return (
                  <EventCard
                    key={td.id}
                    todo={td}
                    variant="allday"
                    style={{ gridColumn: daysBetween(first, td.dateKey) + 1 }}
                    dragging={draggingId === td.id}
                    onOpen={onOpen}
                    onPointerDown={drag.startMove}
                  />
                );
              })}
              {days.map((d, i) => (
                <CalendarOverlaySlot key={`ov-${d}`} dateKey={d} variant="allday" column={i + 1} />
              ))}
            </div>
          </div>
        </div>
        <div className="cal-wrow">
          <div className="cal-corner">
            <TimeGutter />
          </div>
          {days.map((d) => (
            <DayTimeline
              key={d}
              dateKey={d}
              events={placedByDay.get(d) ?? noEvents}
              isToday={d === ctl.todayKey}
              past={d < ctl.todayKey}
              weekend={!!weekendOf(d)}
              nowMin={nowMin}
              faintNow={weekStartOf(d, ctl.weekStart) === todayWeek}
              over={preview?.over === d && !!preview.todo && isOnDay(preview.todo, d) && !!preview.todo.startTime}
              draggingId={draggingId}
              creating={preview?.create?.dateKey === d ? preview.create : null}
              onOpen={onOpen}
              onStartMove={drag.startMove}
              onStartResize={drag.startResize}
              onStartCreate={drag.startCreate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
