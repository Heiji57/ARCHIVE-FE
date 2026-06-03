import { useState } from "react";
import {
  FolderGit2,
  Link2,
  Link2Off,
  Lock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AvailableRepository } from "@/entities/github/model/types";
import { DisconnectBanner } from "@/shared/ui/disconnect-banner/DisconnectBanner";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingsCardHeader } from "./SettingsCardHeader";

export function GithubCard() {
  const {
    state,
    loadGitHubAvailableRepos,
    linkGitHubRepo,
    unlinkGitHubRepo,
    unlinkAllGitHubRepos,
    syncAllGitHubRepos,
    pushNotification,
  } = useArchiveApp();
  const { t } = useTranslation();
  const { status, linkedRepositories } = state.github;

  const [available, setAvailable] = useState<AvailableRepository[] | null>(null);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const openAvailable = async () => {
    if (available !== null) {
      setAvailable(null);
      return;
    }
    setLoadingAvailable(true);
    try {
      setAvailable(await loadGitHubAvailableRepos());
    } catch {
      setAvailable([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleLink = async (githubRepoId: number) => {
    setBusy(true);
    await linkGitHubRepo(githubRepoId);
    // 연결 후 후보 목록에서 제거
    setAvailable((prev) =>
      prev ? prev.filter((r) => r.githubRepoId !== githubRepoId) : prev,
    );
    setBusy(false);
  };

  const handleSyncAll = async () => {
    setBusy(true);
    await syncAllGitHubRepos();
    setAvailable(null);
    setBusy(false);
  };

  const trailing =
    status === "connected" ? (
      <Pill tone="green">{t("settings.github.connected")}</Pill>
    ) : status === "unknown" ? (
      <Pill tone="ghost">{t("settings.github.checking")}</Pill>
    ) : (
      <Pill tone="ghost">{t("settings.github.notConnected")}</Pill>
    );

  return (
    <section className="settings-card">
      <SettingsCardHeader
        icon={<FolderGit2 size={20} />}
        iconVariant="ink"
        eyebrow={t("settings.section.github")}
        title="GitHub"
        trailing={trailing}
      />

      {status === "connected" ? (
        <>
          <div className="github-repo-list">
            {linkedRepositories.length === 0 ? (
              <p className="github-empty">{t("settings.github.noLinked")}</p>
            ) : (
              linkedRepositories.map((repo) => (
                <div key={repo.id} className="github-repo-row">
                  <div className="github-repo-meta">
                    <span className="github-repo-name">{repo.fullName}</span>
                    {repo.isPrivate ? (
                      <span className="github-repo-badge">
                        <Lock size={10} /> private
                      </span>
                    ) : null}
                    <span className="github-repo-branch">{repo.defaultBranch}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-utility github-repo-unlink"
                    onClick={() => unlinkGitHubRepo(repo.id)}
                    title={t("settings.github.unlink")}
                  >
                    <Link2Off size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="github-actions">
            <button
              type="button"
              className="btn btn-utility settings-action-btn"
              onClick={() => void openAvailable()}
              disabled={busy || loadingAvailable}
            >
              <Plus size={14} /> {t("settings.github.addRepo")}
            </button>
            <button
              type="button"
              className="btn btn-utility settings-action-btn"
              onClick={() => void handleSyncAll()}
              disabled={busy}
            >
              <RefreshCw size={13} /> {t("settings.github.syncAll")}
            </button>
            {linkedRepositories.length > 0 ? (
              <button
                type="button"
                className="btn btn-utility settings-action-btn"
                onClick={unlinkAllGitHubRepos}
                disabled={busy}
              >
                <Link2Off size={13} /> {t("settings.github.unlinkAll")}
              </button>
            ) : null}
          </div>

          {available !== null ? (
            <div className="github-available">
              <p className="github-available-title">
                {t("settings.github.available")}
              </p>
              {loadingAvailable ? (
                <p className="github-empty">{t("settings.github.checking")}</p>
              ) : available.length === 0 ? (
                <p className="github-empty">{t("settings.github.noAvailable")}</p>
              ) : (
                available.map((repo) => (
                  <div key={repo.githubRepoId} className="github-repo-row">
                    <div className="github-repo-meta">
                      <span className="github-repo-name">{repo.fullName}</span>
                      {repo.isPrivate ? (
                        <span className="github-repo-badge">
                          <Lock size={10} /> private
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary github-repo-link"
                      onClick={() => void handleLink(repo.githubRepoId)}
                      disabled={busy}
                    >
                      <Link2 size={13} /> {t("settings.github.link")}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </>
      ) : status === "unknown" ? (
        <p className="github-empty">{t("settings.github.checking")}</p>
      ) : (
        <>
          <DisconnectBanner
            message={t("retro.github.notConnected")}
            className="settings-disconnect-banner"
          />
          <p className="github-connect-hint">
            {t("settings.github.connectAccountPending")}
          </p>
          <button
            type="button"
            className="btn btn-primary settings-action-btn"
            onClick={() =>
              pushNotification(
                "info",
                t("settings.github.connectAccount"),
                t("settings.github.connectAccountPending"),
                { category: "sync", transient: true },
              )
            }
          >
            <Link2 size={14} /> {t("settings.github.connectAccount")}
          </button>
        </>
      )}
    </section>
  );
}
