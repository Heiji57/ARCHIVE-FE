import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Bookmark } from "lucide-react";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { fromDateKey } from "@/shared/lib/date";
import { addDaysKey, daysBetween, isMultiDay } from "../model/eventInfo";
import { fmtLongDay, fmtMonthShort, fmtWeekday } from "../model/dateFormat";
import { timesOf } from "../model/grid";
import type { DragPreview, useCalendarDrag } from "../model/useCalendarDrag";
import {
  setCalendarViewport,
  useCalendarViewport,
  type CalendarController,
} from "../model/useCalendarController";
import { monthGridStart, weekStartDay, weekdayOrder } from "../model/weekDays";
import { CalendarOverlaySlot } from "./CalendarOverlaySlot";
import { EventCard } from "./EventCard";

export interface MonthGridProps {
  ctl: CalendarController;
  todos: Todo[];
  drag: ReturnType<typeof useCalendarDrag>;
  preview: DragPreview | null;
  retroDays: ReadonlySet<string>;
  onOpen(id: string): void;
  onCreate(dateKey: string): void;
  onVisibleRange(from: string, to: string): void;
}

const HEAD_H = 34;

/**
 * 월간(시안 d-calendar.html): 주가 위아래로 끝없이 이어진다. 가운데 달이 아닌 칸은 흐리게.
 * 칸 안의 할 일은 시안 월간 카드 1번(상태 색 바탕 + 왼쪽 띠, 시각이 제목 앞), 기간 할 일은 칸을 이은 조각.
 */
export function MonthGrid({ ctl, todos, drag, preview, retroDays, onOpen, onCreate, onVisibleRange }: MonthGridProps) {
  const { t, locale } = useTranslation();
  const vp = useCalendarViewport();
  const { start, n } = ctl.monthRange;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const rh = height ? Math.max(96, Math.floor(((height - HEAD_H) * 0.8) / 5)) : 124;
  const room = Math.max(2, Math.floor((rh - 56) / 22));
  const focusMonth = (vp.anchor ?? ctl.date).slice(0, 7);
  const ws = weekStartDay(ctl.weekStart);

  const cells = useMemo(() => Array.from({ length: n * 7 }, (_, i) => addDaysKey(start, i)), [start, n]);
  const byDay = useMemo(() => {
    const first = cells[0];
    const last = cells[cells.length - 1];
    const m = new Map<string, Todo[]>();
    for (const td of todos) {
      const end = isMultiDay(td) ? td.dueDate! : td.dateKey;
      if (end < first || td.dateKey > last) continue;
      for (let d = td.dateKey < first ? first : td.dateKey; d <= end && d <= last; d = addDaysKey(d, 1)) {
        const l = m.get(d) ?? [];
        l.push(td);
        m.set(d, l);
      }
    }
    for (const [d, l] of m) {
      const spans = l.filter(isMultiDay).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      const rest = l
        .filter((x) => !isMultiDay(x))
        .sort((a, b) => (timesOf(a)?.start ?? -1) - (timesOf(b)?.start ?? -1));
      m.set(d, [...spans, ...rest]);
    }
    return m;
  }, [todos, cells]);

  /* ---------- 크기와 스크롤 ---------- */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pendingRows = useRef(0);
  const extending = useRef(false);
  const tick = useRef(false);
  const ctlRef = useRef(ctl);
  const rhRef = useRef(rh);
  useEffect(() => {
    ctlRef.current = ctl;
    rhRef.current = rh;
  });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingRows.current) {
      el.scrollTop += pendingRows.current * rh;
      pendingRows.current = 0;
    }
    extending.current = false;
  }, [start, n, rh]);

  const report = () => {
    const el = scrollRef.current;
    if (!el) return;
    const c = ctlRef.current;
    const h = rhRef.current;
    const st = el.scrollTop;
    const s0 = c.monthRange.start;
    const r0 = Math.floor(st / h);
    const rows = Math.max(1, Math.floor((el.clientHeight - HEAD_H) / h));
    const mid = Math.floor((st + (el.clientHeight - HEAD_H) / 2) / h);
    const tr = Math.floor(daysBetween(s0, c.todayKey) / 7);
    setCalendarViewport({
      anchor: addDaysKey(s0, mid * 7 + 3),
      todayDir: tr < r0 ? "up" : tr > r0 + rows - 1 ? "down" : "in",
    });
    onVisibleRange(addDaysKey(s0, r0 * 7), addDaysKey(s0, (r0 + rows + 1) * 7 - 1));
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const c = ctlRef.current;
    const i = Math.floor(daysBetween(c.monthRange.start, c.date) / 7);
    const visible = i * rh >= el.scrollTop - 1 && (i + 1) * rh <= el.scrollTop + el.clientHeight - HEAD_H + 1;
    if (c.jump.force || !visible) {
      el.scrollTop = Math.floor(daysBetween(c.monthRange.start, monthGridStart(c.date, c.weekStart)) / 7) * rh;
    }
    report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctl.jump.seq, rh]);

  const onScroll = () => {
    if (tick.current) return;
    tick.current = true;
    requestAnimationFrame(() => {
      tick.current = false;
      const el = scrollRef.current;
      if (!el) return;
      const h = rhRef.current;
      if (!extending.current) {
        if (el.scrollTop < h * 3) {
          extending.current = true;
          pendingRows.current += ctlRef.current.extend("month", -1) / 7;
        } else if (el.scrollTop + el.clientHeight > el.scrollHeight - h * 3) {
          extending.current = true;
          ctlRef.current.extend("month", 1);
        }
      }
      report();
    });
  };

  const draggingId = preview?.todo?.id ?? null;

  return (
    <div ref={scrollRef} className="cal-scroll" onScroll={onScroll} tabIndex={-1}>
      <div className="cal-mo-h">
        {weekdayOrder(ctl.weekStart).map((w) => (
          <div key={w} className={w === 0 ? "we sun" : w === 6 ? "we sat" : undefined}>
            {fmtWeekday(locale, w)}
          </div>
        ))}
      </div>
      <div className="cal-mo-g" style={{ "--rh": `${rh}px` } as CSSProperties}>
        {cells.map((d) => {
          const x = fromDateKey(d);
          const dow = x.getDay();
          const l = byDay.get(d) ?? [];
          const shown = l.slice(0, room);
          const more = l.length - shown.length;
          const cls = [
            "cal-mc",
            dow === 0 ? "we sun" : dow === 6 ? "we sat" : "",
            d === ctl.todayKey ? "today" : "",
            d.slice(0, 7) !== focusMonth ? "dim" : "",
            preview?.over === d ? "drop" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={d}
              className={cls}
              data-drop={d}
              onClick={(e) => {
                if (e.target === e.currentTarget) onCreate(d);
              }}
            >
              <div className="cal-mh">
                <button
                  type="button"
                  className="cal-mn"
                  aria-label={t("cal.day.aria", { date: fmtLongDay(locale, d), n: l.length })}
                  aria-current={d === ctl.date ? "date" : undefined}
                  onClick={() => ctl.pick(d)}
                >
                  {x.getDate() === 1 ? <span className="cal-mm">{fmtMonthShort(locale, d)}</span> : null}
                  {x.getDate()}
                </button>
                {retroDays.has(d) ? (
                  <span className="cal-bm" title={t("cal.retroMark")}>
                    <Bookmark size={12} aria-label={t("cal.retroMark")} />
                  </span>
                ) : null}
              </div>
              {shown.map((td) => {
                const multi = isMultiDay(td);
                const pos = !multi ? undefined : d === td.dateKey ? "s" : d === td.dueDate ? "e" : "m";
                return (
                  <EventCard
                    key={td.id}
                    todo={td}
                    variant="month"
                    piece={pos ? { pos, label: pos === "s" || dow === ws } : undefined}
                    dragging={draggingId === td.id}
                    onOpen={onOpen}
                    onPointerDown={drag.startMove}
                  />
                );
              })}
              <CalendarOverlaySlot dateKey={d} variant="month" />
              {more > 0 ? (
                <button type="button" className="cal-more" onClick={() => ctl.pick(d, { view: "week", force: true })}>
                  {t("cal.more", { n: more })}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

