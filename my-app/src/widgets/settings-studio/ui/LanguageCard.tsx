import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { SUPPORTED_LOCALES, type Locale } from "@/app/model/settings";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingRow } from "./SettingRow";

export function LanguageCard() {
  const { state, setLocale } = useArchiveApp();
  const { t } = useTranslation();

  return (
    <SettingRow
      label={t("settings.language.label")}
      description={t("settings.language.rowHint")}
    >
      <div className="setting-seg">
        {SUPPORTED_LOCALES.map((opt) => {
          const active = state.settings.locale === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              className="setting-seg-btn"
              data-active={active ? "true" : undefined}
              onClick={() => setLocale(opt.code as Locale)}
            >
              {opt.native}
            </button>
          );
        })}
      </div>
    </SettingRow>
  );
}
