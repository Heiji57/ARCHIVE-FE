import { Globe2 } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { SUPPORTED_LOCALES, type Locale } from "@/app/model/settings";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingsCardHeader } from "./SettingsCardHeader";

export function LanguageCard() {
  const { state, setLocale } = useArchiveApp();
  const { t } = useTranslation();

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<Globe2 size={20} />}
        iconVariant="primary"
        eyebrow={t("settings.section.language")}
        title={t("settings.language.label")}
      />

      <div className="locale-grid">
        {SUPPORTED_LOCALES.map((opt) => {
          const active = state.settings.locale === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              className="locale-btn"
              data-active={active ? "true" : undefined}
              onClick={() => setLocale(opt.code as Locale)}
            >
              <p className="locale-btn-native">{opt.native}</p>
              <p className="locale-btn-label">{opt.label}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
