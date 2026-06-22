import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import type { TranslationKey } from "@/shared/lib/i18n";
import { SettingRow } from "./SettingRow";

type SummaryKey = "weekly" | "monthly" | "yearly";

const ROWS: { key: SummaryKey; labelKey: TranslationKey }[] = [
  { key: "weekly", labelKey: "settings.autoSummary.weekly" },
  { key: "monthly", labelKey: "settings.autoSummary.monthly" },
  { key: "yearly", labelKey: "settings.autoSummary.yearly" },
];

export function AutoSummaryCard() {
  const { state, setAutoSummary } = useArchiveApp();
  const { t } = useTranslation();
  const a = state.settings.autoSummary;

  return (
    <>
      {ROWS.map(({ key, labelKey }) => {
        const on = a[key];
        return (
          <SettingRow key={key} label={t(labelKey)}>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              className="ios-toggle"
              data-on={on}
              onClick={() => setAutoSummary({ [key]: !on })}
            />
          </SettingRow>
        );
      })}
    </>
  );
}
