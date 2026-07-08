import { useEffect, useState } from "react";
import { Minimize2 } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";

const MINIMIZE_DELAY_MS = 1000;

export function SummaryOverlay() {
  const { state, minimizeSummary } = useArchiveApp();
  const { t } = useTranslation();
  const pending = state.pendingSummary;
  const [canMinimize, setCanMinimize] = useState(false);

  useEffect(() => {
    // 최소화 버튼은 오버레이 표시 1초 뒤 나타난다 — 타이머(외부 시스템)와 동기화하는
    // 정당한 패턴이라 set-state-in-effect 를 예외 처리한다.
    if (!pending || pending.minimized) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanMinimize(false);
      return;
    }
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
