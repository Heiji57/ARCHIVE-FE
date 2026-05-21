import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";

const legendItemStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "var(--color-body-muted)",
} as const;

/** Status legend row shown beneath the calendar grid. */
export function CalendarLegend() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        marginTop: 40,
        display: "flex",
        gap: 28,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span style={legendItemStyle}>
          <Circle size={14} style={{ color: "var(--color-ink-muted-48)" }} />
          {t("calendar.legend.notStart")}
        </span>
        <span style={legendItemStyle}>
          <PlayCircle size={14} style={{ color: "var(--color-primary)" }} />
          {t("calendar.legend.inProgress")}
        </span>
        <span style={legendItemStyle}>
          <CheckCircle2
            size={14}
            style={{ color: "var(--color-status-done)" }}
          />
          {t("calendar.legend.done")}
        </span>
      </div>
    </div>
  );
}
