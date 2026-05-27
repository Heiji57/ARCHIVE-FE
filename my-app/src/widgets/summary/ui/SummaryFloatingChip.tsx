import { Sparkles } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";

export function SummaryFloatingChip() {
  const { state } = useArchiveApp();
  const { t } = useTranslation();
  const pending = state.pendingSummary;

  if (!pending || !pending.minimized) return null;

  const kindLabel = t(`summary.kind.${pending.kind}` as const);

  return (
    <div
      className="summary-chip"
      role="status"
      aria-live="polite"
      title={t("summary.processing.message")}
    >
      <div className="summary-chip-spinner" />
      <Sparkles size={14} />
      <span>{kindLabel} {t("summary.processing.title")}</span>
    </div>
  );
}
