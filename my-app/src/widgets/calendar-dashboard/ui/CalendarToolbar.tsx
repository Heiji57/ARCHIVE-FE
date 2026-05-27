import { useTranslation } from "@/shared/lib/i18n";
import { formatMonthLabel } from "@/shared/lib/date";
import type { CalendarView } from "../model/useCalendarNav";

export interface CalendarToolbarProps {
  view: CalendarView;
  cursor: Date;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

/** Top toolbar of the calendar: view toggle + nav buttons + month label. */
export function CalendarToolbar({
  view,
  cursor,
  onViewChange,
  onPrev,
  onToday,
  onNext,
}: CalendarToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar-left">
        <div className="seg">
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
            aria-pressed={view === "month"}
            onClick={() => onViewChange("month")}
          >
            {t("calendar.view.month")}
          </button>
        </div>
        <h2 className="t-display-md calendar-toolbar-title">
          {formatMonthLabel(cursor)}
        </h2>
      </div>

      <div className="calendar-toolbar-nav">
        <button type="button" className="btn btn-utility" onClick={onPrev}>
          {t("calendar.nav.prev")}
        </button>
        <button type="button" className="btn btn-utility" onClick={onToday}>
          {t("calendar.nav.today")}
        </button>
        <button type="button" className="btn btn-utility" onClick={onNext}>
          {t("calendar.nav.next")}
        </button>
      </div>
    </div>
  );
}
