import { Sparkles } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { ToggleRow } from "@/shared/ui/toggle-row/ToggleRow";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingsCardHeader } from "./SettingsCardHeader";

export function AutoSummaryCard() {
  const { state, setAutoSummary } = useArchiveApp();
  const { t } = useTranslation();
  const a = state.settings.autoSummary;

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<Sparkles size={20} />}
        iconVariant="primary"
        eyebrow={t("settings.section.autoSummary")}
        title="AI Auto-Summary"
      />
      <p className="settings-card-description">
        {t("settings.autoSummary.description")}
      </p>

      <ToggleRow
        label={t("settings.autoSummary.weekly")}
        on={a.weekly}
        onChange={(v) => setAutoSummary({ weekly: v })}
      />
      <ToggleRow
        label={t("settings.autoSummary.monthly")}
        on={a.monthly}
        onChange={(v) => setAutoSummary({ monthly: v })}
      />
      <ToggleRow
        label={t("settings.autoSummary.yearly")}
        on={a.yearly}
        onChange={(v) => setAutoSummary({ yearly: v })}
      />
    </section>
  );
}
