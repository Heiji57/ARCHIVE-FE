import { useTranslation } from "@/shared/lib/i18n";
import { useRightPanel } from "@/widgets/app-shell";
import { useSuggestions } from "../model/useSuggestions";
import { SuggestionGroup } from "./SuggestionGroup";
import type { AiSuggestion } from "../model/demoSuggestions";
import "./ai-suggestions.css";

const KINDS: AiSuggestion["kind"][] = ["overdue", "free_slot", "commit_match"];

export function SuggestionsTab() {
  const { t } = useTranslation();
  const { open } = useRightPanel();
  const { items, applied, apply, dismiss } = useSuggestions(open);

  if (items.length === 0) {
    return <p className="asg-empty">{t("ai.sug.empty")}</p>;
  }

  return (
    <div className="asg-root">
      <p className="asg-hint">{t("ai.sug.hint")}</p>
      {KINDS.map((kind) => {
        const group = items.filter((s) => s.kind === kind);
        return (
          <SuggestionGroup
            key={kind}
            kind={kind}
            items={group}
            applied={applied}
            onApply={apply}
            onDismiss={dismiss}
          />
        );
      })}
    </div>
  );
}
