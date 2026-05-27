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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
        }}
      >
        {SUPPORTED_LOCALES.map((opt) => {
          const active = state.settings.locale === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLocale(opt.code as Locale)}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "var(--r-md)",
                background: active
                  ? "var(--color-ink)"
                  : "var(--color-tile-3)",
                color: active ? "var(--color-canvas)" : "var(--color-ink)",
                border:
                  "1px solid " +
                  (active ? "var(--color-ink)" : "var(--color-divider-soft)"),
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {opt.native}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                {opt.label}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
