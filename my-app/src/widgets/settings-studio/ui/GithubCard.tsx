import { FolderGit2, Link2, Link2Off } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { DisconnectBanner } from "@/shared/ui/disconnect-banner/DisconnectBanner";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";
import { DEMO_GITHUB } from "../model/constants";
import { SettingsCardHeader } from "./SettingsCardHeader";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "baseline",
        fontSize: 13,
      }}
    >
      <span
        style={{
          color: "var(--color-body-muted)",
          minWidth: 110,
          fontSize: 12,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "var(--color-ink)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function GithubCard() {
  const { state, saveGitHubConfig, pushNotification } = useArchiveApp();
  const { t } = useTranslation();
  const config = state.githubConfig;
  const isConnected = Boolean(config?.enabled);

  const handleConnect = () => {
    saveGitHubConfig({ ...DEMO_GITHUB, enabled: true });
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
          <div
            style={{
              background: "var(--color-tile-3)",
              borderRadius: "var(--r-lg)",
              padding: "14px 18px",
              marginBottom: 14,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 10,
            }}
          >
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
            className="btn btn-utility"
            onClick={handleDisconnect}
            style={{ padding: "10px 18px" }}
          >
            <Link2Off size={14} /> {t("settings.github.disconnect")}
          </button>
        </>
      ) : (
        <>
          <DisconnectBanner
            message={t("retro.github.notConnected")}
            style={{ marginBottom: 16 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConnect}
            style={{ padding: "10px 18px" }}
          >
            <Link2 size={14} /> {t("settings.github.connect")}
          </button>
        </>
      )}
    </section>
  );
}
