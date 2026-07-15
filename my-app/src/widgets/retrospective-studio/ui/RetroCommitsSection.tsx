import { ExternalLink, GitCommit, RefreshCw } from "lucide-react"
import type { GitHubCommit } from "@/entities/github/model/types"
import { useTranslation } from "@/shared/lib/i18n"

export interface RetroCommitsSectionProps {
  commits: GitHubCommit[]
  loading: boolean
  onRefresh: () => void
  githubConnectedAs: string
  /** verified emails 캐시 보유 여부. false 면 커밋 0건 시 재연결 안내를 표시한다. */
  hasVerifiedEmails: boolean
  /** 오늘 일간 회고 여부 — 제목·빈 상태 문구 구분. */
  isToday: boolean
}

/** 일간 회고의 "오늘의 커밋" 섹션 (개발자 계정 + GitHub 연결 시에만 렌더). */
export function RetroCommitsSection({
  commits,
  loading,
  onRefresh,
  githubConnectedAs,
  hasVerifiedEmails,
  isToday,
}: RetroCommitsSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="section-card-tile-2" style={{ marginBottom: 16 }}>
      <div className="section-card-head">
        <div className="avatar avatar-sm avatar-primary">
          <GitCommit size={14} />
        </div>
        <p className="section-card-title">
          {isToday ? t("retro.editor.commits") : t("retro.editor.commitsPast")}
        </p>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--color-body-muted)",
          }}>
          @{githubConnectedAs}
        </span>
        {/* 새로고침 버튼 */}
        <button
          type="button"
          className="btn btn-utility"
          style={{ padding: "4px 8px", fontSize: 12, marginLeft: 6 }}
          onClick={onRefresh}
          disabled={loading}
          title={t("retro.editor.loadCommits")}>
          <RefreshCw
            size={11}
            style={
              loading
                ? { animation: "summary-spin 900ms linear infinite" }
                : undefined
            }
          />
        </button>
      </div>

      {loading ? (
        <p style={{ margin: 0, fontSize: 16, color: "var(--color-body-muted)" }}>
          {t("retro.editor.loadCommits")}…
        </p>
      ) : commits.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0, fontSize: 16, color: "var(--color-body-muted)" }}>
            {!hasVerifiedEmails
              ? t("retro.github.noCommitsReconnect")
              : isToday
                ? t("retro.editor.noCommits")
                : t("retro.editor.noCommitsPast")}
          </p>
          {/* hasVerifiedEmails=true 인데도 0건: GitHub Emails 안내 링크 */}
          {hasVerifiedEmails && (
            <a
              href="https://github.com/settings/emails"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: "var(--color-primary)",
                textDecoration: "underline",
              }}>
              {t("retro.github.emailsSettingsLink")} ↗
            </a>
          )}
        </div>
      ) : (
        <ul
          className="t-mono"
          style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {commits.map((c) => (
            <li
              key={`${c.repositoryId}-${c.sha}`}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--r-sm)",
                background: "var(--color-tile-3)",
                fontSize: 16,
                lineHeight: 1.5,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}>
              {/* 출처 저장소 배지 */}
              <span
                style={{
                  color: "var(--color-primary-on-dark)",
                  fontWeight: 600,
                  fontSize: 12,
                  background:
                    "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                  padding: "2px 7px",
                  borderRadius: "var(--r-pill)",
                  whiteSpace: "nowrap",
                }}>
                {c.fullName}
              </span>
              <span style={{ flex: 1, minWidth: 160 }}>{c.message}</span>
              <a
                href={c.htmlUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  color: "var(--color-ink-muted-48)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  textDecoration: "none",
                  fontSize: 12,
                }}
                title={c.sha}>
                {c.sha.slice(0, 7)}
                <ExternalLink size={10} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
