import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { TodoBoardRange } from "@/app/model/settings";
import { addDays } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { TODO_RANGE_MAX_DAYS, clampRangeDays } from "@/shared/lib/todoRangePrefs";
import { RULER_TICKS, daysForOffset, offsetForDays } from "../model/todoRangeScale";
import { SettingRow } from "./SettingRow";

type Side = "past" | "future";

const SIDE_KEY: Record<Side, keyof TodoBoardRange> = {
  past: "pastDays",
  future: "futureDays",
};

/** 손잡이를 잡을 수 있는 폭(px). CSS 의 .todo-ruler-handle::before 와 맞춘다. */
const HANDLE_HIT_PX = 28;

interface DragState {
  side: Side;
  range: TodoBoardRange;
  /** 잡을 때 두 손잡이가 겹쳐 있었는지 — 그러면 끄는 방향으로 손잡이를 정한다. */
  overlapped: boolean;
}

/**
 * 할 일 보드 "전체" 보기 범위를 눈금자 위 두 손잡이로 정한다.
 * 왼쪽 손잡이는 지난 일, 오른쪽 손잡이는 앞으로의 일을 며칠까지 보여줄지 정한다.
 * 드래그 중에는 임시 값(drag)만 바꾸고, 손을 떼면 한 번 저장한다.
 */
export function TodoRangeCard() {
  const { state, setTodoBoardRange } = useArchiveApp();
  const { t, locale } = useTranslation();
  const saved = state.settings.todoBoardRange;

  const rulerRef = useRef<HTMLDivElement>(null);
  // 드래그 중인 손잡이와 그 임시 범위. 드래그가 아니면 저장값을 그대로 그린다.
  const [drag, setDrag] = useState<DragState | null>(null);
  // pointermove 는 리렌더 전에 연달아 올 수 있어 state 대신 ref 로 판정한다.
  const dragRef = useRef(drag);
  const draft = drag?.range ?? saved;

  const updateDrag = (next: DragState | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const commit = (next: TodoBoardRange) => {
    if (next.pastDays === saved.pastDays && next.futureDays === saved.futureDays) return;
    setTodoBoardRange(next);
  };

  const onPointerDown = (side: Side) => (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    // 둘 다 오늘 근처면 손잡이가 겹쳐 위에 그려진 쪽만 잡힌다 — 그때는 끄는 방향을 따른다.
    const width = rulerRef.current?.getBoundingClientRect().width ?? 0;
    const gapPx = (offsetForDays(saved.pastDays) + offsetForDays(saved.futureDays)) * width;
    updateDrag({ side, range: saved, overlapped: gapPx < HANDLE_HIT_PX });
  };

  // 포인터를 잡은 손잡이가 이벤트를 모두 받으므로 side 는 drag 상태에서 정한다.
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const current = dragRef.current;
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!current || !rect || rect.width === 0) return;
    const x = (e.clientX - rect.left) / rect.width;
    const side: Side = current.overlapped ? (x < 0.5 ? "past" : "future") : current.side;
    const days = daysForOffset(side === "past" ? 0.5 - x : x - 0.5);
    // 한 번에 한쪽만 움직이므로, 다른 쪽은 저장값을 유지한다.
    updateDrag({ ...current, side, range: { ...saved, [SIDE_KEY[side]]: days } });
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const current = dragRef.current;
    if (!current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    updateDrag(null);
    commit(current.range);
  };

  const onKeyDown = (side: Side) => (e: KeyboardEvent<HTMLDivElement>) => {
    const key = SIDE_KEY[side];
    const current = saved[key];
    // 화면상 방향 그대로: 왼쪽 화살표는 손잡이를 왼쪽으로 옮긴다.
    // 지난 쪽은 왼쪽이 "더 멀리", 앞으로 쪽은 오른쪽이 "더 멀리".
    const outward = side === "past" ? "ArrowLeft" : "ArrowRight";
    const inward = side === "past" ? "ArrowRight" : "ArrowLeft";
    const step = e.shiftKey ? 7 : 1;
    let value: number;
    if (e.key === outward) value = current + step;
    else if (e.key === inward) value = current - step;
    else if (e.key === "Home") value = 0;
    else if (e.key === "End") value = TODO_RANGE_MAX_DAYS;
    else return;
    e.preventDefault();
    commit({ ...saved, [key]: clampRangeDays(value) });
  };

  const formatDate = (offsetDays: number) =>
    addDays(new Date(), offsetDays).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });

  const pastPos = 0.5 - offsetForDays(draft.pastDays);
  const futurePos = 0.5 + offsetForDays(draft.futureDays);
  const pct = (v: number) => `${v * 100}%`;
  const threeMonths = t("settings.todoRange.unit.month", { n: 3 });

  const handle = (side: Side, pos: number) => {
    const days = draft[SIDE_KEY[side]];
    return (
      <div
        className="todo-ruler-handle"
        data-dragging={drag?.side === side || undefined}
        style={{ left: pct(pos) }}
        role="slider"
        tabIndex={0}
        aria-label={t(side === "past" ? "settings.todoRange.past" : "settings.todoRange.future")}
        aria-valuemin={0}
        aria-valuemax={TODO_RANGE_MAX_DAYS}
        aria-valuenow={days}
        aria-valuetext={t(
          side === "past" ? "settings.todoRange.pastValue" : "settings.todoRange.futureValue",
          { n: days },
        )}
        onPointerDown={onPointerDown(side)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown(side)}
      />
    );
  };

  return (
    <SettingRow
      label={t("settings.todoRange.label")}
      description={t("settings.todoRange.hint")}
      stacked
    >
      <div className="todo-ruler-box">
        <div className="todo-ruler" ref={rulerRef}>
          <div className="todo-ruler-track">
            {RULER_TICKS.flatMap(({ days, major }) => {
              const off = offsetForDays(days);
              return [0.5 - off, 0.5 + off].map((pos) => (
                <i
                  key={`${days}-${pos}`}
                  className={`todo-ruler-tick${major ? " todo-ruler-tick--major" : ""}`}
                  style={{ left: pct(pos) }}
                />
              ));
            })}
            <div
              className="todo-ruler-fill"
              style={{ left: pct(pastPos), width: pct(futurePos - pastPos) }}
            />
            <div className="todo-ruler-today" />
          </div>
          {handle("past", pastPos)}
          {handle("future", futurePos)}
        </div>

        <div className="todo-ruler-scale" aria-hidden="true">
          <span style={{ left: "0%" }}>{t("settings.todoRange.scale.yearAgo")}</span>
          <span style={{ left: pct(0.5 - offsetForDays(90)) }}>{threeMonths}</span>
          <span style={{ left: "50%" }}>{t("settings.todoRange.today")}</span>
          <span style={{ left: pct(0.5 + offsetForDays(90)) }}>{threeMonths}</span>
          <span style={{ left: "100%" }}>{t("settings.todoRange.scale.yearAhead")}</span>
        </div>

        <div className="todo-ruler-legend">
          <span>
            {draft.pastDays === 0 ? (
              t("settings.todoRange.pastNone")
            ) : (
              <>
                <b>{t("settings.todoRange.from", { date: formatDate(-draft.pastDays) })}</b>{" "}
                <span className="todo-ruler-days">
                  {t("settings.todoRange.days", { n: draft.pastDays })}
                </span>
              </>
            )}
          </span>
          <span>
            {draft.futureDays === 0 ? (
              t("settings.todoRange.futureNone")
            ) : (
              <>
                <b>{t("settings.todoRange.to", { date: formatDate(draft.futureDays) })}</b>{" "}
                <span className="todo-ruler-days">
                  {t("settings.todoRange.days", { n: draft.futureDays })}
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </SettingRow>
  );
}
