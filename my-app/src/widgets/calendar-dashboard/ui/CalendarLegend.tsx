import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";

/** Status legend row shown beneath the calendar grid. */
export function CalendarLegend() {
  const { t } = useTranslation();

  return (
    <div className="calendar-legend">
      <div className="calendar-legend-group">
        <span className="calendar-legend-item">
          <CheckCircle2 size={14} className="status-icon" data-status="done" />
          {t("calendar.legend.done")}
        </span>
        <span className="calendar-legend-item">
          <PlayCircle size={14} className="status-icon" data-status="in-progress" />
          {t("calendar.legend.inProgress")}
        </span>
        <span className="calendar-legend-item">
          <Circle size={14} className="status-icon" data-status="not-start" />
          {t("calendar.legend.notStart")}
        </span>
      </div>
    </div>
  );
}
