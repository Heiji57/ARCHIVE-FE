import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { fromDateKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { useRightPanel } from "@/widgets/app-shell";
import {
  addDaysKey,
  applyPreview,
  daysBetween,
  fmtLongDay,
  fmtMonthDayShort,
  formatKey,
  passesFilter,
  useCalendarFilter,
  useTodoDrag,
  useUserCalendars,
  type CalendarController,
} from "@/widgets/calendar-dashboard";
import { useTodoEditor } from "@/widgets/todo-editor";
import { setBoardViewport } from "../model/boardViewport";
import { onColumn, sortDay } from "../model/sortDay";
import { BoardCard } from "./BoardCard";

/** 열 너비(시안 COLW). */
const COLW = 272;
/** 끝에서 이만큼 열 안쪽에 닿으면 늘린다. */
const EDGE = 3;
/** 한 번에 늘리는 날 수(시안 CH). */
const STEP = 14;
/** 서버 목록 조회 한 번의 최대 범위(일). */
const MAX_RANGE = 62;

const rangeFor = (d: string) => ({ start: addDaysKey(d, -21), n: 49 });

/**
 * 할 일 보드(시안 d-todos.html): 날짜별 열이 옆으로 끝없이 이어진다(끝에 가까워지면 14일씩).
 * 열마다 머리(요일, 날짜, 회고 있음, 오른쪽 캘린더에 이 날 보기), 할 일 추가, 카드 목록.
 * 카드를 누르면 할 일 창, 다른 열이나 오른쪽 패널 시간표로 끌어 놓으면 날짜·시간이 바뀐다.
 * 거르기(태그, 숨긴 캘린더)는 캘린더 사이드바와 같다.
 */
export function TodoBoard({ ctl }: { ctl: CalendarController }) {
  const { t, locale } = useTranslation();
  const { state, loadTodosForView } = useArchiveApp();
  const editor = useTodoEditor();
  const panel = useRightPanel();
  const filter = useCalendarFilter();
  const { calendarOf } = useUserCalendars();
  const drag = useTodoDrag();
  const today = ctl.todayKey;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState(() => rangeFor(ctl.date));
  const pendingShift = useRef(0);
  const extending = useRef(false);

  const days = useMemo(() => Array.from({ length: range.n }, (_, i) => addDaysKey(range.start, i)), [range]);
  const todos = useMemo(
    () =>
      applyPreview(
        state.todos.filter((td) => passesFilter(td, filter, calendarOf(td)?.id ?? null)),
        drag.preview,
      ),
    [state.todos, filter, calendarOf, drag.preview],
  );
  const byDay = useMemo(() => {
    const first = days[0];
    const last = days[days.length - 1];
    const m = new Map<string, typeof todos>();
    for (const td of todos) {
      const end = td.dueDate && td.dueDate > td.dateKey ? td.dueDate : td.dateKey;
      if (end < first || td.dateKey > last) continue;
      for (const d of days) if (onColumn(td, d)) m.set(d, [...(m.get(d) ?? []), td]);
    }
    for (const [d, l] of m) m.set(d, sortDay(l));
    return m;
  }, [todos, days]);
  const retroDays = useMemo(
    () => new Set(state.entries.filter((e) => e.retroType === "daily" && !e.isSummary).map((e) => e.dateKey)),
    [state.entries],
  );

  /* ---------- 불러오기(실제 모드): 보이는 범위가 불러온 범위를 벗어나면 ---------- */
  const loaded = useRef<{ from: string; to: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const onVisible = useCallback(
    (from: string, to: string) => {
      const l = loaded.current;
      if (l && from >= l.from && to <= l.to) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const span = daysBetween(from, to) + 1;
        const pad = Math.max(0, Math.floor((MAX_RANGE - span) / 2));
        const r = { from: addDaysKey(from, -pad), to: addDaysKey(to, Math.min(pad, MAX_RANGE - span - pad)) };
        loaded.current = r;
        void loadTodosForView(r.from, r.to);
      }, 250);
    },
    [loadTodosForView],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* ---------- 스크롤: 제목, 오늘 방향, 끝에서 늘리기 ---------- */
  const rangeRef = useRef(range);
  // 아래 layout effect 들보다 먼저 최신 범위로
  useLayoutEffect(() => {
    rangeRef.current = range;
  });
  const report = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const r = rangeRef.current;
    const i0 = Math.floor((el.scrollLeft + 2) / COLW);
    const vis = Math.max(1, Math.floor(el.clientWidth / COLW));
    const ti = daysBetween(r.start, today);
    setBoardViewport({
      anchor: addDaysKey(r.start, Math.floor((el.scrollLeft + COLW * 0.5) / COLW)),
      todayDir: ti < i0 ? "left" : ti > i0 + vis - 1 ? "right" : "in",
    });
    onVisible(addDaysKey(r.start, i0), addDaysKey(r.start, i0 + Math.ceil(el.clientWidth / COLW)));
  }, [today, onVisible]);

  /** 그 날이 두 번째 열쯤 오게(앞 열이 반쯤 보임, 시안). */
  const scrollToDay = useCallback(
    (d: string) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollLeft = Math.max(0, (daysBetween(rangeRef.current.start, d) - 1 + 0.55) * COLW);
      report();
    },
    [report],
  );
  const pendingJump = useRef<string | null>(null);

  // 범위가 바뀐 뒤: 앞쪽으로 늘린 만큼 옮겨 보던 열 유지, 범위를 새로 잡은 이동 요청 마저 하기
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingShift.current) {
      el.scrollLeft += pendingShift.current * COLW;
      pendingShift.current = 0;
    }
    if (pendingJump.current) {
      scrollToDay(pendingJump.current);
      pendingJump.current = null;
    }
    extending.current = false;
  }, [range, scrollToDay]);

  // 이동 요청(오늘, 미니 달력, 열의 "캘린더"): 그 날이 안 보이거나 force 면 옮긴다.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const r = rangeRef.current;
    const i = daysBetween(r.start, ctl.date);
    if (i < 4 || i > r.n - 8) {
      pendingJump.current = ctl.date;
      setRange(rangeFor(ctl.date));
      return;
    }
    const visible = i * COLW >= el.scrollLeft - 1 && (i + 1) * COLW <= el.scrollLeft + el.clientWidth + 1;
    if (ctl.jump.force || !visible) scrollToDay(ctl.date);
    else report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctl.jump.seq]);

  const tick = useRef(false);
  const onScroll = () => {
    if (tick.current) return;
    tick.current = true;
    requestAnimationFrame(() => {
      tick.current = false;
      const el = scrollRef.current;
      if (!el) return;
      if (!extending.current) {
        if (el.scrollLeft < COLW * EDGE) {
          extending.current = true;
          pendingShift.current += STEP;
          setRange((r) => ({ start: addDaysKey(r.start, -STEP), n: r.n + STEP }));
        } else if (el.scrollLeft + el.clientWidth > el.scrollWidth - COLW * EDGE) {
          extending.current = true;
          setRange((r) => ({ ...r, n: r.n + STEP }));
        }
      }
      report();
    });
  };

  const draggingId = drag.preview?.todo?.id ?? null;
  const over = drag.preview?.over ?? null;

  return (
    <div
      ref={scrollRef}
      className="bd"
      role="region"
      aria-label={t("todos.board.label")}
      data-dragging={drag.preview ? "" : undefined}
      onScroll={onScroll}
    >
      {days.map((d) => {
        const x = fromDateKey(d);
        const m1 = x.getDate() === 1;
        const list = byDay.get(d) ?? [];
        const cls = ["bd-col", d < today ? "past" : "", d === today ? "today" : "", m1 ? "m1" : ""].filter(Boolean).join(" ");
        return (
          <section key={d} className={cls} aria-label={fmtLongDay(locale, d)}>
            <div className="bd-h">
              <div className="bd-d">
                {m1 ? <span className="bd-mtag">{formatKey(locale, d, { month: "short" })}</span> : null}
                <b>
                  {formatKey(locale, d, { weekday: "long" })}
                  {d === today ? ` · ${t("todos.board.today")}` : ""}
                </b>
                <small>
                  {fmtMonthDayShort(locale, d)}
                  {retroDays.has(d) ? ` · ${t("todos.board.hasRetro")}` : ""}
                </small>
              </div>
              <button
                type="button"
                className="bd-act"
                title={t("todos.board.showCalTitle")}
                aria-label={t("todos.board.showCalAria", { date: fmtLongDay(locale, d) })}
                onClick={() => {
                  ctl.pick(d);
                  if (!panel.open) panel.setTab(panel.tab);
                }}
              >
                {t("todos.board.showCal")}
              </button>
            </div>
            <button
              type="button"
              className="bd-add"
              aria-label={t("todos.board.addAria", { date: fmtLongDay(locale, d) })}
              onClick={() => editor.createTodo({ dateKey: d })}
            >
              <Plus size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
              <span>{t("todos.board.add")}</span>
            </button>
            <div className={`bd-list${over === d ? " drop" : ""}`} data-drop={d}>
              {list.length ? (
                list.map((td) => (
                  <BoardCard
                    key={td.id}
                    todo={td}
                    todayKey={today}
                    dragging={draggingId === td.id}
                    onOpen={editor.openTodo}
                    onPointerDown={drag.startMove}
                  />
                ))
              ) : (
                <div className="bd-empty">{t("todos.board.empty")}</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
