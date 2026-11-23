import { useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { fromDateKey } from "@/shared/lib/date";
import { ICON_STROKE } from "@/shared/ui/icons";
import { addDaysKey } from "../model/eventInfo";
import { fmtLongDay, fmtWeekday, fmtYearMonth } from "../model/dateFormat";
import { monthGridStart, weekdayOrder, type WeekStart } from "../model/weekDays";

const shiftMonth = (ym: string, d: number) => {
  const [y, m] = ym.split("-").map(Number);
  const x = new Date(y, m - 1 + d, 1, 12);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};

/** 미니 달력(시안 shared.js miniHTML). 회고 쓴 날은 짧은 막대, 할 일 있는 날은 점. 화살표로 날짜 이동. */
export function MiniMonth({
  selected,
  todayKey,
  weekStart,
  hasTodo,
  hasRetro,
  onPick,
  children,
}: {
  selected: string;
  todayKey: string;
  weekStart: WeekStart;
  hasTodo(dateKey: string): boolean;
  hasRetro(dateKey: string): boolean;
  onPick(dateKey: string): void;
  /** 달력 아래 한 줄(오늘 회고). */
  children?: ReactNode;
}) {
  const { t, locale } = useTranslation();
  const selMonth = selected.slice(0, 7);
  const [shown, setShown] = useState(selMonth);
  const [lastSel, setLastSel] = useState(selMonth);
  // 고른 날짜가 다른 달로 바뀌면 그 달을 보인다(렌더 중 상태 맞추기).
  if (selMonth !== lastSel) {
    setLastSel(selMonth);
    setShown(selMonth);
  }
  const first = monthGridStart(`${shown}-01`, weekStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDaysKey(first, i));

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const cur = (e.target as HTMLElement).dataset.d;
    if (!d || !cur) return;
    e.preventDefault();
    const next = addDaysKey(cur, d);
    if (next.slice(0, 7) !== shown) setShown(next.slice(0, 7));
    requestAnimationFrame(() =>
      (e.currentTarget?.ownerDocument ?? document).querySelector<HTMLButtonElement>(`.cal-mini-g [data-d="${next}"]`)?.focus(),
    );
  };

  return (
    <section className="cal-mini" aria-label={t("cal.mini.label")}>
      <div className="cal-mini-h">
        <b>{fmtYearMonth(locale, `${shown}-01`)}</b>
        <span>
          <button type="button" className="sh-ibtn" aria-label={t("cal.mini.prev")} onClick={() => setShown(shiftMonth(shown, -1))}>
            <ChevronLeft size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
          <button type="button" className="sh-ibtn" aria-label={t("cal.mini.next")} onClick={() => setShown(shiftMonth(shown, 1))}>
            <ChevronRight size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className="cal-mini-g" onKeyDown={onKey}>
        {weekdayOrder(weekStart).map((w) => (
          <span key={w} className="cal-mini-dw" aria-hidden="true">
            {fmtWeekday(locale, w)}
          </span>
        ))}
        {cells.map((d) => {
          const r = hasRetro(d);
          const has = !r && hasTodo(d);
          return (
            <button
              key={d}
              type="button"
              data-d={d}
              tabIndex={d === selected || (selected.slice(0, 7) !== shown && d === `${shown}-01`) ? 0 : -1}
              className={`${d.slice(0, 7) !== shown ? "other" : ""}${d === todayKey ? " today" : ""}`}
              aria-current={d === selected ? "date" : undefined}
              aria-label={fmtLongDay(locale, d)}
              onClick={() => onPick(d)}
            >
              {fromDateKey(d).getDate()}
              {r ? <i className="r" /> : has ? <i /> : null}
            </button>
          );
        })}
      </div>
      {children}
    </section>
  );
}
