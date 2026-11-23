import { useTranslation } from "@/shared/lib/i18n";
import type { AiSuggestion } from "../model/demoSuggestions";

interface Props {
  kind: AiSuggestion["kind"];
  items: AiSuggestion[];
  applied: Set<string>;
  onApply(id: string, actionCode: string): void;
  onDismiss(id: string): void;
}

const KIND_LABEL_KEY = {
  overdue: "ai.sug.kindOverdue",
  free_slot: "ai.sug.kindFreeSlot",
  commit_match: "ai.sug.kindCommitMatch",
} as const;

export function SuggestionGroup({ kind, items, applied, onApply, onDismiss }: Props) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <section className="asg-group">
      <h3 className="asg-group-label">{t(KIND_LABEL_KEY[kind])}</h3>
      <ul className="asg-list">
        {items.map((s) => {
          const isApplied = applied.has(s.id);
          return (
            <li key={s.id} className={`asg-item${isApplied ? " asg-item--applied" : ""}`}>
              <div className="asg-item-title">{s.title}</div>
              <div className="asg-item-reason">{s.reason}</div>
              {!isApplied && (
                <div className="asg-item-actions">
                  {s.actions.map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      className="asg-action-btn"
                      onClick={() => onApply(s.id, a.code)}
                    >
                      {a.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="asg-dismiss-btn"
                    aria-label={t("ai.sug.dismiss")}
                    onClick={() => onDismiss(s.id)}
                  >
                    ×
                  </button>
                </div>
              )}
              {isApplied && (
                <div className="asg-applied-label">{t("ai.sug.applied")}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
