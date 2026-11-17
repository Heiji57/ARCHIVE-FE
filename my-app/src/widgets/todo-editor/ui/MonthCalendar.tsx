import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { weekdayName } from "@/entities/todo/lib/recurrence";
import type { Weekday } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { dateLabel } from "../model/format";
import { shiftDays } from "../model/dates";

const WEEK: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** 월요일 시작 달력(시안 `.z-cal`). min 보다 앞 날은 고를 수 없다. */
export function MonthCalendar({
  value,
  min,
  today,
  label,
  onPick,
}: {
  value: string | null;
  min?: string | null;
  today: string;
  label: string;
  onPick: (dateKey: string) => void;
}) {
  const { t, locale } = useTranslation();
  const [ym, setYm] = useState((value ?? min ?? today).slice(0, 7));
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`),
  ];
  const move = (d: number) => {
    const n = new Date(y, m - 1 + d, 1);
    setYm(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`);
  };
  const title = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(first);
  return (
    <div className="z-cal">
      <div className="z-mh">
        <button type="button" className="z-ib" aria-label={t("todoEditor.cal.prev")} onClick={() => move(-1)}>
          <ChevronLeft size={14} strokeWidth={ICON_STROKE} aria-hidden />
        </button>
        <b>{title}</b>
        <button type="button" className="z-ib" aria-label={t("todoEditor.cal.next")} onClick={() => move(1)}>
          <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden />
        </button>
      </div>
      <div className="z-g" role="group" aria-label={label}>
        {WEEK.map((w) => (
          <span key={w} className="z-w" aria-hidden>
            {weekdayName(w, locale, "short")}
          </span>
        ))}
        {cells.map((c, i) =>
          c ? (
            <button
              key={c}
              type="button"
              className={c === today ? "today" : undefined}
              aria-pressed={c === value}
              aria-label={dateLabel(c, locale)}
              disabled={Boolean(min && c < min)}
              onClick={() => onPick(c)}
              onKeyDown={(e) => {
                const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
                if (!step) return;
                e.preventDefault();
                const next = shiftDays(c, step);
                if (next.slice(0, 7) !== ym) setYm(next.slice(0, 7));
                requestAnimationFrame(() =>
                  (document.querySelector(`.z-g button[aria-label="${dateLabel(next, locale)}"]`) as HTMLElement | null)?.focus(),
                );
              }}
            >
              {Number(c.slice(8))}
            </button>
          ) : (
            <span key={`e${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
