import type { ReactNode } from "react";
import type { AppSettings } from "@/app/model/settings";
import type { TranslationKey } from "@/shared/lib/i18n";
import { useTranslation } from "@/shared/lib/i18n";
import { AutoSummaryCard } from "./AutoSummaryCard";
import { GithubCard } from "./GithubCard";
import { LanguageCard } from "./LanguageCard";
import { NotificationsCard } from "./NotificationsCard";
import { RegionTimezoneCard } from "./RegionTimezoneCard";
import { SessionsCard } from "./SessionsCard";
import { TemplatesCard } from "./TemplatesCard";

function SettingsSection({
  label,
  hint,
  children,
}: {
  label: TranslationKey;
  hint: TranslationKey;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <h2 className="settings-section-label">{t(label)}</h2>
        <p className="settings-section-hint">{t(hint)}</p>
      </div>
      {children}
    </section>
  );
}

export function SettingsStudio() {
  return (
    <div className="page settings-page">
      <SettingsSection
        label="settings.section.integrations"
        hint="settings.group.integrations.hint"
      >
        <div className="settings-grid">
          <GithubCard />
        </div>
      </SettingsSection>

      <SettingsSection
        label="settings.section.preferences"
        hint="settings.group.preferences.hint"
      >
        <div className="settings-grid">
          <LanguageCard />
          <RegionTimezoneCard />
          <AutoSummaryCard />
          <NotificationsCard />
        </div>
      </SettingsSection>

      <SettingsSection
        label="settings.section.security"
        hint="settings.group.security.hint"
      >
        <div className="settings-grid">
          <SessionsCard />
        </div>
      </SettingsSection>

      <SettingsSection
        label="settings.section.templates"
        hint="settings.group.templates.hint"
      >
        <TemplatesCard />
      </SettingsSection>
    </div>
  );
}

export type { AppSettings };
