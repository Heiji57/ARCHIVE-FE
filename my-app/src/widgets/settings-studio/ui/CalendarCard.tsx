import { useState } from "react";
import { CalendarDays, Link2, Link2Off, RefreshCw } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { DisconnectBanner } from "@/shared/ui/disconnect-banner/DisconnectBanner";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingsCardHeader } from "./SettingsCardHeader";

export function CalendarCard() {
  const { state, connectCalendar, disconnectCalendar, syncCalendar, pushNotification } =
    useArchiveApp();
  const { t, locale } = useTranslation();
  const { status, googleUserId, lastSyncedAt } = state.calendar;

  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    const result = await connectCalendar();
    setConnecting(false);
    if (!result.ok && result.error && result.error !== "popup-closed") {
      pushNotification(
        "warning",
        t("settings.section.calendar"),
        t("settings.calendar.connectFailed"),
        { category: "sync", transient: true },
      );
    }
  };

  const handleSync = async () => {
    if (busy) return;
    setBusy(true);
    const result = await syncCalendar();
    setBusy(false);
    if (result.ok) {
      pushNotification(
        "success",
        t("settings.section.calendar"),
        t("settings.calendar.synced"),
        { category: "sync", transient: true },
      );
    }
  };

  const handleDisconnect = async () => {
    if (busy) return;
    setBusy(true);
    const result = await disconnectCalendar();
    setBusy(false);
    if (result.ok) {
      pushNotification(
        "info",
        t("settings.section.calendar"),
        t("settings.calendar.disconnected"),
        { category: "sync", transient: true },
      );
    }
  };

  const lastSyncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString(locale)
    : t("settings.calendar.lastSyncedNever");

  const trailing =
    status === "connected" ? (
      <Pill tone="green">{t("settings.calendar.connected")}</Pill>
    ) : status === "needs-reauth" ? (
      <Pill tone="warn">{t("settings.calendar.needsReauth")}</Pill>
    ) : status === "unknown" ? (
      <Pill tone="ghost">{t("settings.calendar.checking")}</Pill>
    ) : (
      <Pill tone="ghost">{t("settings.calendar.notConnected")}</Pill>
    );

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<CalendarDays size={20} />}
        iconVariant="ink"
        eyebrow={t("settings.section.integrations")}
        title="Google Calendar"
        trailing={trailing}
      />

      {status === "unknown" ? (
        <p className="github-empty">{t("settings.calendar.checking")}</p>
      ) : status === "connected" || status === "needs-reauth" ? (
        <>
          {/* 연결된 계정 표시 */}
          {googleUserId ? (
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 12,
                color: "var(--color-body-muted)",
              }}
            >
              {t("settings.calendar.connectedAs", { account: googleUserId })}
            </p>
          ) : null}
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 11,
              color: "var(--color-body-muted)",
            }}
          >
            {t("settings.calendar.lastSynced")} · {lastSyncedLabel}
          </p>

          {/* 재인증 필요 배너 */}
          {status === "needs-reauth" ? (
            <div
              style={{
                margin: "0 0 14px",
                padding: "10px 14px",
                background: "var(--color-warn-subtle, rgba(234,179,8,.1))",
                border: "1px solid var(--color-warn, #ca8a04)",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>🔄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-warn-text, #854d0e)",
                  }}
                >
                  {t("settings.calendar.reauthBanner")}
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    color: "var(--color-body-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {t("settings.calendar.reauthBannerMsg")}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: 11, padding: "4px 10px" }}
                  onClick={() => void handleConnect()}
                  disabled={connecting}
                >
                  {connecting
                    ? t("settings.calendar.connecting")
                    : t("settings.calendar.reconnect")}
                </button>
              </div>
            </div>
          ) : null}

          {/* 액션 버튼 */}
          <div className="github-actions">
            <button
              type="button"
              className="btn btn-utility settings-action-btn"
              onClick={() => void handleSync()}
              disabled={busy}
            >
              <RefreshCw
                size={13}
                style={
                  busy
                    ? { animation: "summary-spin 900ms linear infinite" }
                    : undefined
                }
              />{" "}
              {busy ? t("settings.calendar.syncing") : t("settings.calendar.sync")}
            </button>
            <button
              type="button"
              className="btn btn-utility settings-action-btn"
              onClick={() => void handleDisconnect()}
              disabled={busy}
            >
              <Link2Off size={13} /> {t("settings.calendar.disconnect")}
            </button>
          </div>
        </>
      ) : (
        <>
          <DisconnectBanner
            message={t("settings.calendar.notConnected")}
            className="settings-disconnect-banner"
          />
          <p className="github-connect-hint">
            {t("settings.calendar.connectHint")}
          </p>
          <button
            type="button"
            className="btn btn-primary settings-action-btn"
            onClick={() => void handleConnect()}
            disabled={connecting}
          >
            <Link2 size={14} />{" "}
            {connecting
              ? t("settings.calendar.connecting")
              : t("settings.calendar.connect")}
          </button>
        </>
      )}
    </section>
  );
}
