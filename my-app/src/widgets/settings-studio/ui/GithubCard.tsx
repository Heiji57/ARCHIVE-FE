import { FolderGit2, Link2, Link2Off } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { DisconnectBanner } from "@/shared/ui/disconnect-banner/DisconnectBanner";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";
import { DEMO_GITHUB } from "../model/constants";
import { SettingsCardHeader } from "./SettingsCardHeader";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="github-info-row">
      <span className="github-info-label">{label}</span>
      <span className="github-info-value">{value}</span>
    </div>
  );
}

export function GithubCard() {
  const { state, saveGitHubConfig, pushNotification } = useArchiveApp();
  const { t } = useTranslation();
  const config = state.githubConfig;
  const isConnected = Boolean(config?.enabled);

  const handleConnect = () => {
    // connectedAt / lastSyncedAt 을 클릭 시점으로 기록한다
    const now = new Date().toISOString();
    saveGitHubConfig({
      ...DEMO_GITHUB,
      enabled: true,
      connectedAt: now,
      lastSyncedAt: now,
    });
    pushNotification(
      "success",
      t("settings.github.connected"),
      `@${DEMO_GITHUB.connectedAs}`,
      { category: "sync" },
    );
  };

  const handleDisconnect = () => {
    saveGitHubConfig(null);
    pushNotification(
      "info",
      t("settings.github.notConnected"),
      t("settings.github.disconnect"),
      { category: "sync" },
    );
  };

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<FolderGit2 size={20} />}
        iconVariant="ink"
        eyebrow={t("settings.section.github")}
        title="GitHub"
        trailing={
          isConnected ? (
            <Pill tone="green">{t("settings.github.connected")}</Pill>
          ) : (
            <Pill tone="ghost">{t("settings.github.notConnected")}</Pill>
          )
        }
      />

      {isConnected && config ? (
        <>
          <div className="github-info-box">
            <Row
              label={t("settings.github.connectedAs")}
              value={`@${config.connectedAs ?? "—"}`}
            />
            <Row
              label={t("settings.github.targetRepo")}
              value={config.targetRepository ?? "—"}
            />
            <Row
              label={t("settings.github.permissions")}
              value={(config.permissions ?? []).join(" · ")}
            />
            <Row
              label={t("settings.github.lastSync")}
              value={
                config.lastSyncedAt
                  ? new Date(config.lastSyncedAt).toLocaleString()
                  : "—"
              }
            />
          </div>

          <button
            type="button"
            className="btn btn-utility settings-action-btn"
            onClick={handleDisconnect}
          >
            <Link2Off size={14} /> {t("settings.github.disconnect")}
          </button>
        </>
      ) : (
        <>
          <DisconnectBanner
            message={t("retro.github.notConnected")}
            className="settings-disconnect-banner"
          />
          <button
            type="button"
            className="btn btn-primary settings-action-btn"
            onClick={handleConnect}
          >
            <Link2 size={14} /> {t("settings.github.connect")}
          </button>
        </>
      )}
    </section>
  );
}
