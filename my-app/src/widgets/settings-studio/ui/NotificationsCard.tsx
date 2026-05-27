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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--color-tile-3)",
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
        }}
      >
        <input
          type="number"
          min={1}
          max={365}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value) || 0)}
          onBlur={() => {
            const clamped = Math.max(1, Math.min(365, draft || 30));
            setDraft(clamped);
            setNotificationRetention(clamped);
          }}
          style={{
            width: 80,
            fontSize: 16,
            fontWeight: 600,
            textAlign: "center",
            background: "transparent",
            color: "var(--color-ink)",
          }}
        />
        <span style={{ fontSize: 13, color: "var(--color-body-muted)" }}>
          {t("settings.notifications.retention.unit")}
        </span>
      </div>
    </section>
  );
}
