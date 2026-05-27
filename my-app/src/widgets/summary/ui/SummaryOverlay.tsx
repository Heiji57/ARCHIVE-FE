import { useEffect, useState } from "react";
import { Minimize2 } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";

const MINIMIZE_DELAY_MS = 2000;

export function SummaryOverlay() {
  const { state, minimizeSummary } = useArchiveApp();
  const { t } = useTranslation();
  const pending = state.pendingSummary;
  const [canMinimize, setCanMinimize] = useState(false);

  useEffect(() => {
    if (!pending || pending.minimized) {
      setCanMinimize(false);
      return;
    }
    // Minimize button appears 2s after the overlay shows.
    setCanMinimize(false);
    const id = window.setTimeout(
      () => setCanMinimize(true),
      MINIMIZE_DELAY_MS,
    );
    return () => window.clearTimeout(id);
  }, [pending?.id, pending?.minimized]);

  if (!pending || pending.minimized) return null;

  return (
    <div className="summary-overlay" role="dialog" aria-modal="true">
      <div className="summary-overlay-card">
        <div className="summary-overlay-spinner" />
        <h3 className="summary-overlay-title">
          {t("summary.processing.title")}
        </h3>
        <p className="summary-overlay-message">
          {t("summary.processing.message")}
        </p>
        <button
          type="button"
          className="btn btn-utility summary-overlay-action"
          onClick={minimizeSummary}
          disabled={!canMinimize}
        >
          <Minimize2 size={14} /> {t("summary.minimize")}
        </button>
      </div>
    </div>
  );
}
