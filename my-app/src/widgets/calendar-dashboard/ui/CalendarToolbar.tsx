import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { formatFullDate, formatMonthLabel } from "@/shared/lib/date";
import type { CalendarView } from "../model/useCalendarNav";
import { CalendarLegend } from "./CalendarLegend";

export interface CalendarToolbarProps {
  view: CalendarView;
  cursor: Date;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

/** Top toolbar of the calendar: view toggle + ‹ Today › nav + period label + legend. */
export function CalendarToolbar({
  view,
  cursor,
  onViewChange,
  onPrev,
  onToday,
  onNext,
}: CalendarToolbarProps) {
  const { t, locale } = useTranslation();

  const title =
    view === "day" ? formatFullDate(cursor, locale) : formatMonthLabel(cursor, locale);

  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar-left">
        <div className="seg">
          <button
            type="button"
            className="seg-btn"
            aria-pressed={view === "month"}
            onClick={() => onViewChange("month")}
          >
            {t("calendar.view.month")}
          </button>
          <button
            type="button"
            className="seg-btn"
            aria-pressed={view === "week"}
            onClick={() => onViewChange("week")}
          >
            {t("calendar.view.week")}
          </button>
          <button
            type="button"
            className="seg-btn"
            aria-pressed={view === "day"}
            onClick={() => onViewChange("day")}
          >
            {t("calendar.view.day")}
          </button>
        </div>

        <div className="calendar-toolbar-nav">
          <button
            type="button"
            className="btn-icon"
            onClick={onPrev}
            aria-label={t("calendar.nav.prev")}
          >
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="btn btn-utility" onClick={onToday}>
            {t("calendar.nav.today")}
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={onNext}
            aria-label={t("calendar.nav.next")}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <h2 className="t-display-md calendar-toolbar-title">{title}</h2>
      </div>

      <CalendarLegend />
    </div>
  );
}
