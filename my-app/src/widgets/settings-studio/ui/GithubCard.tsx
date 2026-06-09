import { useState } from "react";
import {
  Eye,
  EyeOff,
  FolderGit2,
  Link2,
  Link2Off,
  Lock,
  Plus,
  RefreshCw,
  Target,
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
    updateLinkedRepo,
    unlinkGitHubRepo,
    unlinkAllGitHubRepos,
    syncAllGitHubRepos,
    setPushTarget,
    linkGitHubAccount,
    pushNotification,
  } = useArchiveApp();
  const { t } = useTranslation();
  const { status, login, linkedRepositories, pushTargetRepositoryId, hasVerifiedEmails } =
    state.github;

  const [available, setAvailable] = useState<AvailableRepository[] | null>(
    null,
  );
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnectAccount = async () => {
    if (connecting) return;
    setConnecting(true);
    const result = await linkGitHubAccount();
    setConnecting(false);
    if (result.ok) {
      pushNotification(
        "success",
        t("settings.github.connectAccount"),
        t("settings.github.connected"),
        { category: "sync", transient: true },
      );
    } else if (result.error && result.error !== "popup-closed") {
      const alreadyLinked =
        result.error === "account-already-linked" ||
        result.error === "provider-already-linked";
      pushNotification(
        "warning",
        t("settings.github.connectAccount"),
        alreadyLinked
          ? t("settings.github.alreadyLinked")
          : t("settings.github.connectFailed"),
        { category: "sync", transient: true },
      );
    }
  };

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

  // 이미 연결된 저장소는 추가 목록에서 제외
  const linkedGithubRepoIds = new Set(
    linkedRepositories.map((r) => r.githubRepoId),
  );
  const filteredAvailable =
    available?.filter((r) => !linkedGithubRepoIds.has(r.githubRepoId)) ?? null;

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
          {/* 연결된 계정 표시 */}
          {login ? (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                color: "var(--color-body-muted)",
              }}
            >
              {t("settings.github.connectedAsLogin", { login })}
            </p>
          ) : null}

          {/* 재연결 안내 배너 (hasVerifiedEmails = false 인 구 scope 사용자) */}
          {!hasVerifiedEmails ? (
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
                  {t("settings.github.reconnectBanner")}
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    color: "var(--color-body-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {t("settings.github.reconnectBannerMsg")}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: 11, padding: "4px 10px" }}
                  onClick={() => void handleConnectAccount()}
                  disabled={connecting}
                >
                  {connecting
                    ? t("settings.github.connecting")
                    : t("settings.github.reconnect")}
                </button>
              </div>
            </div>
          ) : null}

          {/* 연결된 저장소 목록 */}
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
                    <span className="github-repo-branch">
                      {repo.defaultBranch}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {/* commitReadEnabled 토글 */}
                    <button
                      type="button"
                      className="btn btn-utility github-repo-unlink"
                      title={
                        repo.commitReadEnabled
                          ? t("settings.github.commitReadOn")
                          : t("settings.github.commitReadOff")
                      }
                      onClick={() =>
                        updateLinkedRepo(repo.id, !repo.commitReadEnabled)
                      }
                      style={{
                        color: repo.commitReadEnabled
                          ? "var(--color-primary)"
                          : "var(--color-body-muted)",
                        padding: "4px 8px",
                        fontSize: 11,
                        gap: 4,
                      }}
                    >
                      {repo.commitReadEnabled ? (
                        <Eye size={12} />
                      ) : (
                        <EyeOff size={12} />
                      )}
                      {repo.commitReadEnabled
                        ? t("settings.github.commitReadOn")
                        : t("settings.github.commitReadOff")}
                    </button>

                    {/* 단일 저장소 연결 해제 */}
                    <button
                      type="button"
                      className="btn btn-utility github-repo-unlink"
                      onClick={() => unlinkGitHubRepo(repo.id)}
                      title={t("settings.github.unlink")}
                    >
                      <Link2Off size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Push 대상 저장소 선택 */}
          {linkedRepositories.length > 0 ? (
            <div
              style={{
                margin: "14px 0",
                padding: "12px 14px",
                background: "var(--color-tile-3)",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--color-divider-soft)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Target size={13} style={{ color: "var(--color-primary)" }} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-ink)",
                  }}
                >
                  {t("settings.github.pushTarget")}
                </span>
              </div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 11,
                  color: "var(--color-body-muted)",
                  lineHeight: 1.5,
                }}
              >
                {t("settings.github.pushTargetHint")}
              </p>
              <select
                className="select"
                value={pushTargetRepositoryId ?? ""}
                onChange={(e) =>
                  setPushTarget(e.target.value || null)
                }
                style={{ width: "100%", fontSize: 13 }}
              >
                <option value="">
                  {t("settings.github.pushTargetNone")}
                </option>
                {linkedRepositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.fullName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* 액션 버튼 */}
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

          {/* 연결 후보 목록 — 이미 연결된 저장소는 filteredAvailable 에서 제외됨 */}
          {available !== null && filteredAvailable !== null ? (
            <div className="github-available">
              <p className="github-available-title">
                {t("settings.github.available")}
              </p>
              {loadingAvailable ? (
                <p className="github-empty">{t("settings.github.checking")}</p>
              ) : filteredAvailable.length === 0 ? (
                <p className="github-empty">
                  {t("settings.github.noAvailable")}
                </p>
              ) : (
                filteredAvailable.map((repo) => (
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
            {t("settings.github.connectAccountHint")}
          </p>
          <button
            type="button"
            className="btn btn-primary settings-action-btn"
            onClick={() => void handleConnectAccount()}
            disabled={connecting}
          >
            <Link2 size={14} />{" "}
            {connecting
              ? t("settings.github.connecting")
              : t("settings.github.connectAccount")}
          </button>
        </>
      )}
    </section>
  );
}
