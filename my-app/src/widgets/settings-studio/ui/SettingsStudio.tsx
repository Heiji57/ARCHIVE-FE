import { useState } from "react";
import {
  Bell,
  FolderGit2,
  Globe2,
  Link2,
  Link2Off,
  Sparkles,
} from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import {
  SUPPORTED_LOCALES,
  type AppSettings,
  type Locale,
} from "@/app/model/settings";
import type { GitHubConfig } from "@/entities/github/model/types";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";

const DEMO_GITHUB: GitHubConfig = {
  token: "",
  owner: "developer",
  repo: "my-daily-retrospectives",
  enabled: true,
  lastSyncedAt: new Date().toISOString(),
  connectedAs: "developer",
  targetRepository: "developer/my-daily-retrospectives",
  permissions: ["Read Commits", "Write to Repositories"],
  trackedRepositories: [
    { id: "repo-1", name: "archive-backend", enabled: true },
    { id: "repo-2", name: "archive-frontend", enabled: true },
  ],
  autoRetrospectiveEnabled: true,
};

// ─── GithubCard ──────────────────────────────────────────────────────────────

function GithubCard() {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div className="avatar avatar-md avatar-ink">
          <FolderGit2 size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 4px", color: "var(--color-body-muted)" }}
          >
            {t("settings.section.github")}
          </p>
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            GitHub
          </h3>
        </div>
        {isConnected ? (
          <Pill tone="green">{t("settings.github.connected")}</Pill>
        ) : (
          <Pill tone="ghost">{t("settings.github.notConnected")}</Pill>
        )}
      </div>

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
          <div className="disconnect-banner" style={{ marginBottom: 16 }}>
            <Link2Off size={14} style={{ color: "var(--color-warn)" }} />
            <span>{t("retro.github.notConnected")}</span>
          </div>
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

// ─── LanguageCard ────────────────────────────────────────────────────────────

function LanguageCard() {
  const { state, setLocale } = useArchiveApp();
  const { t } = useTranslation();
  return (
    <section className="settings-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div className="avatar avatar-md avatar-primary">
          <Globe2 size={20} />
        </div>
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 4px", color: "var(--color-body-muted)" }}
          >
            {t("settings.section.language")}
          </p>
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {t("settings.language.label")}
          </h3>
        </div>
      </div>

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

// ─── AutoSummaryCard ─────────────────────────────────────────────────────────

function AutoSummaryCard() {
  const { state, setAutoSummary } = useArchiveApp();
  const { t } = useTranslation();
  const a = state.settings.autoSummary;

  const ToggleRow = ({
    label,
    on,
    onChange,
  }: {
    label: string;
    on: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        background: "var(--color-tile-3)",
        borderRadius: "var(--r-md)",
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className="ios-toggle"
        data-on={on}
      />
    </div>
  );

  return (
    <section className="settings-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div className="avatar avatar-md avatar-primary">
          <Sparkles size={20} />
        </div>
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 4px", color: "var(--color-body-muted)" }}
          >
            {t("settings.section.autoSummary")}
          </p>
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            AI Auto-Summary
          </h3>
        </div>
      </div>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 13,
          color: "var(--color-body-muted)",
          lineHeight: 1.55,
        }}
      >
        {t("settings.autoSummary.description")}
      </p>

      <ToggleRow
        label={t("settings.autoSummary.weekly")}
        on={a.weekly}
        onChange={(v) => setAutoSummary({ weekly: v })}
      />
      <ToggleRow
        label={t("settings.autoSummary.monthly")}
        on={a.monthly}
        onChange={(v) => setAutoSummary({ monthly: v })}
      />
      <ToggleRow
        label={t("settings.autoSummary.yearly")}
        on={a.yearly}
        onChange={(v) => setAutoSummary({ yearly: v })}
      />
    </section>
  );
}

// ─── NotificationsCard ───────────────────────────────────────────────────────

function NotificationsCard() {
  const { state, setNotificationRetention } = useArchiveApp();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<number>(
    state.settings.notificationRetentionDays,
  );

  return (
    <section className="settings-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div className="avatar avatar-md avatar-ink">
          <Bell size={20} />
        </div>
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 4px", color: "var(--color-body-muted)" }}
          >
            {t("settings.section.notifications")}
          </p>
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {t("settings.notifications.retention.label")}
          </h3>
        </div>
      </div>

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

// ─── SettingsStudio ──────────────────────────────────────────────────────────

export function SettingsStudio() {
  return (
    <div
      className="page"
      style={{
        paddingTop: 32,
        paddingBottom: 80,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 24,
      }}
    >
      <GithubCard />
      <LanguageCard />
      <AutoSummaryCard />
      <NotificationsCard />
    </div>
  );
}

export type { AppSettings };
