import { useState } from "react";
import { Bell } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingsCardHeader } from "./SettingsCardHeader";

export function NotificationsCard() {
  const { state, setNotificationRetention } = useArchiveApp();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<number>(
    state.settings.notificationRetentionDays,
  );

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<Bell size={20} />}
        iconVariant="ink"
        eyebrow={t("settings.section.notifications")}
        title={t("settings.notifications.retention.label")}
      />

      <div className="notif-retention-box">
        <input
          type="number"
          min={1}
          max={365}
          value={draft}
          className="notif-retention-input"
          onChange={(e) => setDraft(Number(e.target.value) || 0)}
          onBlur={() => {
            const clamped = Math.max(1, Math.min(365, draft || 30));
            setDraft(clamped);
            setNotificationRetention(clamped);
          }}
        />
        <span className="notif-retention-unit">
          {t("settings.notifications.retention.unit")}
        </span>
      </div>
    </section>
  );
}
