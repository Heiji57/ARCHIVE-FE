import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { TodoBoardRange } from "@/app/model/settings";
import { addDays } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { TODO_RANGE_MAX_DAYS, clampRangeDays } from "@/shared/lib/todoRangePrefs";
import { RULER_TICKS, daysForOffset, offsetForDays } from "../model/todoRangeScale";

type Side = "past" | "future";
const KEY: Record<Side, keyof TodoBoardRange> = { past: "pastDays", future: "futureDays" };
/** 손잡이를 잡을 수 있는 폭(px). CSS .sx-rg-h::before 와 맞춘다. */
const HIT_PX = 28;

interface Drag {
  side: Side;
  range: TodoBoardRange;
  overlapped: boolean;
}

/**
 * 할 일 "전체" 보기 기간(기존 TodoRangeCard 로직 그대로, 시안 sx-range 모양).
 * 가운데가 오늘, 왼쪽 손잡이는 지난 일, 오른쪽은 앞으로의 일. 끄는 동안은 임시 값, 놓으면 한 번 저장.
 */
export function RangeRuler() {
  const { state, setTodoBoardRange } = useArchiveApp();
  const { t, locale } = useTranslation();
  const saved = state.settings.todoBoardRange;
  const ruler = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef(drag);
  const draft = drag?.range ?? saved;
  const upd = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };
  const commit = (next: TodoBoardRange) => {
    if (next.pastDays !== saved.pastDays || next.futureDays !== saved.futureDays) setTodoBoardRange(next);
  };

  const onDown = (side: Side) => (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    const w = ruler.current?.getBoundingClientRect().width ?? 0;
    const gap = (offsetForDays(saved.pastDays) + offsetForDays(saved.futureDays)) * w;
    upd({ side, range: saved, overlapped: gap < HIT_PX });
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const cur = dragRef.current;
    const r = ruler.current?.getBoundingClientRect();
    if (!cur || !r || r.width === 0) return;
    const x = (e.clientX - r.left) / r.width;
    const side: Side = cur.overlapped ? (x < 0.5 ? "past" : "future") : cur.side;
    const days = daysForOffset(side === "past" ? 0.5 - x : x - 0.5);
    upd({ ...cur, side, range: { ...saved, [KEY[side]]: days } });
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const cur = dragRef.current;
    if (!cur) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    upd(null);
    commit(cur.range);
  };
  const onKey = (side: Side) => (e: KeyboardEvent<HTMLDivElement>) => {
    const k = KEY[side];
    const cur = saved[k];
    const out = side === "past" ? "ArrowLeft" : "ArrowRight";
    const inn = side === "past" ? "ArrowRight" : "ArrowLeft";
    const step = e.shiftKey ? 7 : 1;
    let v: number;
    if (e.key === out) v = cur + step;
    else if (e.key === inn) v = cur - step;
    else if (e.key === "Home") v = 0;
    else if (e.key === "End") v = TODO_RANGE_MAX_DAYS;
    else return;
    e.preventDefault();
    commit({ ...saved, [k]: clampRangeDays(v) });
  };

  const day = (n: number) => addDays(new Date(), n).toLocaleDateString(locale, { month: "short", day: "numeric" });
  const a = 0.5 - offsetForDays(draft.pastDays);
  const b = 0.5 + offsetForDays(draft.futureDays);
  const pct = (v: number) => `${v * 100}%`;
  const handle = (side: Side, pos: number) => {
    const n = draft[KEY[side]];
    return (
      <div
        className="sx-rg-h"
        data-dragging={drag?.side === side || undefined}
        style={{ left: pct(pos) }}
        role="slider"
        tabIndex={0}
        aria-label={t(side === "past" ? "settings.todoRange.past" : "settings.todoRange.future")}
        aria-valuemin={0}
        aria-valuemax={TODO_RANGE_MAX_DAYS}
        aria-valuenow={n}
        aria-valuetext={t(side === "past" ? "settings.todoRange.pastValue" : "settings.todoRange.futureValue", { n })}
        onPointerDown={onDown(side)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey(side)}
      />
    );
  };
  const three = t("settings.todoRange.unit.month", { n: 3 });

  return (
    <div className="sx-range">
      <div className="sx-rg" ref={ruler}>
        <div className="sx-track">
          {RULER_TICKS.flatMap(({ days, major }) => {
            const off = offsetForDays(days);
            return [0.5 - off, 0.5 + off].map((p) => <i key={`${days}-${p}`} className={`sx-tick${major ? " mj" : ""}`} style={{ left: pct(p) }} />);
          })}
          <span className="sx-fill" style={{ left: pct(a), width: pct(b - a) }} />
          <span className="sx-now" />
        </div>
        {handle("past", a)}
        {handle("future", b)}
      </div>
      <div className="sx-scale" aria-hidden="true">
        <span style={{ left: "0%" }}>{t("settings.todoRange.scale.yearAgo")}</span>
        <span style={{ left: pct(0.5 - offsetForDays(90)) }}>{three}</span>
        <span style={{ left: "50%" }}>{t("settings.todoRange.today")}</span>
        <span style={{ left: pct(0.5 + offsetForDays(90)) }}>{three}</span>
        <span style={{ left: "100%" }}>{t("settings.todoRange.scale.yearAhead")}</span>
      </div>
      <p className="sx-rv">
        <span>
          {draft.pastDays === 0 ? (
            t("settings.todoRange.pastNone")
          ) : (
            <>
              <b>{t("settings.todoRange.from", { date: day(-draft.pastDays) })}</b> {t("settings.todoRange.days", { n: draft.pastDays })}
            </>
          )}
        </span>
        <span>
          {draft.futureDays === 0 ? (
            t("settings.todoRange.futureNone")
          ) : (
            <>
              <b>{t("settings.todoRange.to", { date: day(draft.futureDays) })}</b> {t("settings.todoRange.days", { n: draft.futureDays })}
            </>
          )}
        </span>
      </p>
    </div>
  );
}
