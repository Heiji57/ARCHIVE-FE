import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  GitCommit,
  Lock,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Save,
  X,
} from "lucide-react"
import type { JournalEntry } from "@/entities/entry/model/types"
import type { GitHubCommit } from "@/entities/github/model/types"
import { useArchiveApp } from "@/app/providers/useArchiveApp"
import { can } from "@/shared/lib/permissions"
import { ConfirmModal } from "@/shared/ui/confirm-modal/ConfirmModal"
import { DisconnectBanner } from "@/shared/ui/disconnect-banner/DisconnectBanner"
import { Pill } from "@/shared/ui/pill/Pill"
import { useTodayKey } from "@/app/providers/useToday"
import { formatFullDate, fromDateKey } from "@/shared/lib/date"
import { useTranslation } from "@/shared/lib/i18n"
import { EditorErrorBoundary } from "@/shared/ui/rich-editor"
import { RETRO_LABEL_KEY } from "../model/constants"
import { extractMarkdownHeadings } from "../model/extractMarkdownHeadings"

// TipTap 에디터는 번들 크기가 크므로 회고록 페이지 진입 시에만 로드
const RichEditor = lazy(() => import("@/shared/ui/rich-editor/ui/RichEditor"))

export interface RetroEditorProps {
  entry: JournalEntry
  completedTodos: { id: string; title: string }[]
  githubConnectedAs: string
  isGithubConnected: boolean
  /** verified emails 캐시 보유 여부. false 면 커밋 0건 시 재연결 안내를 표시한다. */
  hasVerifiedEmails: boolean
  pushTargetRepositoryId: string | null
  onUpdate: (patch: Partial<Pick<JournalEntry, "title" | "content">>) => void
  onSave: () => void
  /** AI 요약(isSummary) 편집 해제 — 확인 후 AI 원본으로 되돌린다. */
  onRevertSummary?: () => void
}

export function RetroEditor({
  entry,
  completedTodos,
  githubConnectedAs,
  isGithubConnected,
  hasVerifiedEmails,
  pushTargetRepositoryId,
  onUpdate,
  onSave,
  onRevertSummary,
}: RetroEditorProps) {
  const { t } = useTranslation()
  const { state, loadCommits, pushRetrospective, pushNotification } = useArchiveApp()
  const isGithubEnabled = can(state.settings.accountType, "github")
  const todayDateKey = useTodayKey()
  const d = fromDateKey(entry.dateKey)
  const retroLabel = t(RETRO_LABEL_KEY[entry.retroType])

  // 커밋 섹션은 모든 일간 회고에 표시 (오늘 + 과거 날짜 모두)
  const isDailyEntry = entry.retroType === "daily"
  // 오늘 여부 — 제목·빈 상태 문구 구분에 사용
  const isTodayDaily = isDailyEntry && entry.dateKey === todayDateKey

  // ─── 커밋 로드 (로컬 state — entry 별 독립 관리) ──────────────────────────
  // loadCommits 가 결과를 직접 반환하므로, 전역 state 를 거치지 않고 이 컴포넌트
  // 인스턴스(key=entry.id 로 재마운트)에 격리된 커밋 목록을 유지한다.
  // → 다른 날짜 회고를 열어도 오늘 커밋이 덮어쓰이지 않는다.
  const [commits, setCommits] = useState<GitHubCommit[]>([])
  const [loadingCommits, setLoadingCommits] = useState(false)

  // 일간 회고를 열 때 자동으로 해당 날짜 커밋 1회 로드 (오늘 + 과거 모두)
  const commitsLoadedRef = useRef(false)
  useEffect(() => {
    if (!isDailyEntry || !isGithubConnected) return
    if (commitsLoadedRef.current) return
    commitsLoadedRef.current = true
    setLoadingCommits(true)
    void loadCommits(entry.dateKey)
      .then(setCommits)
      .finally(() => setLoadingCommits(false))
  }, [isDailyEntry, isGithubConnected, entry.dateKey, loadCommits])

  const handleRefreshCommits = () => {
    setLoadingCommits(true)
    void loadCommits(entry.dateKey)
      .then(setCommits)
      .finally(() => setLoadingCommits(false))
  }

  // ─── Push ──────────────────────────────────────────────────────────────────
  const [pushing, setPushing] = useState(false)

  const handlePush = async () => {
    if (!isGithubConnected || !pushTargetRepositoryId) return
    setPushing(true)
    const result = await pushRetrospective(
      entry.retroType,
      entry.dateKey,
      entry.content,
    )
    setPushing(false)
    if (result.ok) {
      onSave() // synced 마킹
      pushNotification("success", t("retro.editor.pushSuccess"), result.path, {
        category: "sync",
      })
    } else {
      pushNotification("warning", t("retro.editor.pushFailed"), result.error, {
        category: "sync",
      })
    }
  }

  // ─── 확장 모드 ─────────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault()
        setExpanded((v) => !v)
        return
      }
      if (expanded && e.key === "Escape") {
        e.preventDefault()
        setExpanded(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [expanded])

  const canPush = isGithubConnected && !!pushTargetRepositoryId

  // ─── AI 요약 되돌리기(편집 해제 → AI 원본 복귀) ────────────────────────────
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false)

  // ─── 확장 모드 목차(Notion 스타일, 확장 모드에서만 노출) ───────────────────
  // 마크다운 헤딩을 뽑아 렌더된 RichEditor DOM 의 h1~h6 요소와 같은 순서로 매칭한다.
  const headings = useMemo(
    () => (expanded ? extractMarkdownHeadings(entry.content) : []),
    [expanded, entry.content],
  )
  const expandMainRef = useRef<HTMLDivElement | null>(null)
  const scrollToHeading = (index: number) => {
    const headingEls =
      expandMainRef.current?.querySelectorAll("h1, h2, h3, h4, h5, h6") ?? []
    headingEls[index]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <article>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}>
        <div>
          <p className="t-eyebrow" style={{ margin: "0 0 6px" }}>
            {retroLabel}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--color-body-muted)",
            }}>
            {formatFullDate(d)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* 자동 저장 안내 */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--color-body-muted)",
            }}>
            <Save size={11} />
            {t("retro.editor.autoSaved")}
          </span>

          {/* AI 요약 되돌리기(편집 해제 → AI 원본 복귀) — 요약 항목에만 노출 */}
          {entry.isSummary && onRevertSummary ? (
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => setRevertConfirmOpen(true)}
              style={{ padding: "6px 12px", fontSize: 12 }}
              title={t("retro.summary.revert")}>
              <RotateCcw size={12} />
              {t("retro.summary.revert")}
            </button>
          ) : null}

          {/* 확장 버튼 */}
          <button
            type="button"
            className="retro-expand-btn"
            onClick={() => setExpanded(true)}
            aria-label="회고록 확장"
            title="회고록 확장 (Ctrl+Shift+F)">
            <Maximize2 size={14} />
          </button>

          {isGithubEnabled && (
            <>
              {isGithubConnected ? (
                entry.synced ? (
                  <Pill tone="green">
                    <Check size={10} /> {t("retro.editor.synced")}
                  </Pill>
                ) : (
                  <Pill tone="warn">
                    <Clock size={10} /> {t("retro.editor.pending")}
                  </Pill>
                )
              ) : (
                <Pill tone="ghost">
                  <Lock size={10} /> {t("settings.github.notConnected")}
                </Pill>
              )}

              {/* Push 버튼 */}
              <button
                type="button"
                onClick={() => void handlePush()}
                className="btn btn-primary"
                style={{ padding: "10px 22px" }}
                disabled={!canPush || pushing}
                title={
                  !isGithubConnected
                    ? t("retro.github.connectFromSettings")
                    : !pushTargetRepositoryId
                      ? t("settings.github.pushTargetHint")
                      : ""
                }>
                <GitCommit size={14} />
                {pushing ? t("retro.editor.pushing") : t("retro.editor.save")}
              </button>
            </>
          )}
        </div>
      </div>

      {isGithubEnabled && !isGithubConnected ? (
        <DisconnectBanner message={t("retro.github.notConnected")} />
      ) : isGithubEnabled && !pushTargetRepositoryId ? (
        <DisconnectBanner message={t("settings.github.pushTargetHint")} />
      ) : null}

      {/* 일반 모드 */}
      {!expanded && (
        <>
          <input
            value={entry.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            readOnly={entry.isSummary}
            title={entry.isSummary ? t("retro.summary.titleReadOnly") : undefined}
            placeholder={t("retro.editor.titlePlaceholder")}
            className="retro-title-input"
          />
          <p
            style={{
              margin: "0 0 32px",
              fontSize: 19,
              color: "var(--color-body-muted)",
              lineHeight: 1.4,
            }}>
            {t("retro.editor.sub")}
          </p>

          {/* 완료된 할 일 — 일간 회고에서만 표시 */}
          {isDailyEntry && (
            <section className="section-card" style={{ marginBottom: 16 }}>
              <div className="section-card-head">
                <div className="avatar avatar-sm avatar-done">
                  <CheckCircle size={14} strokeWidth={2.6} />
                </div>
                <p className="section-card-title">
                  {t("retro.editor.completed")}
                </p>
              </div>

              {completedTodos.length > 0 ? (
                <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {completedTodos.map((tdo) => (
                    <li
                      key={tdo.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--r-sm)",
                        background: "var(--color-tile-3)",
                        fontSize: 14,
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}>
                      <CheckCircle
                        size={14}
                        style={{ color: "var(--color-status-done)" }}
                      />
                      <span style={{ flex: 1 }}>{tdo.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--color-body-muted)",
                  }}>
                  {t("retro.editor.noCompleted")}
                </p>
              )}
            </section>
          )}

          {/* 커밋 기록 (개발자 계정 + 일간 회고 + GitHub 연결 시 표시) */}
          {isGithubEnabled && isGithubConnected && isDailyEntry ? (
            <section
              className="section-card-tile-2"
              style={{ marginBottom: 16 }}>
              <div className="section-card-head">
                <div className="avatar avatar-sm avatar-primary">
                  <GitCommit size={14} />
                </div>
                <p className="section-card-title">
                  {isTodayDaily
                    ? t("retro.editor.commits")
                    : t("retro.editor.commitsPast")}
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
                  style={{ padding: "4px 8px", fontSize: 11, marginLeft: 6 }}
                  onClick={handleRefreshCommits}
                  disabled={loadingCommits}
                  title={t("retro.editor.loadCommits")}>
                  <RefreshCw
                    size={11}
                    style={
                      loadingCommits
                        ? { animation: "summary-spin 900ms linear infinite" }
                        : undefined
                    }
                  />
                </button>
              </div>

              {loadingCommits ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--color-body-muted)",
                  }}>
                  {t("retro.editor.loadCommits")}…
                </p>
              ) : commits.length === 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--color-body-muted)",
                    }}>
                    {!hasVerifiedEmails
                      ? t("retro.github.noCommitsReconnect")
                      : isTodayDaily
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
                        fontSize: 11,
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
                        fontSize: 13,
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
                          fontSize: 11,
                          background:
                            "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                          padding: "2px 7px",
                          borderRadius: "var(--r-pill)",
                          whiteSpace: "nowrap",
                        }}>
                        {c.fullName}
                      </span>
                      <span style={{ flex: 1, minWidth: 160 }}>
                        {c.message}
                      </span>
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
                          fontSize: 11,
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
          ) : null}

          {/* 미완성 요약(GET /entries/paginated placeholder) 안내 배너 */}
          {entry.isSummary && entry.status && entry.status !== "completed" ? (
            <div
              style={{
                padding: "10px 14px",
                marginBottom: 12,
                borderRadius: "var(--r-sm)",
                background: "var(--color-tile-3)",
                fontSize: 13,
                color: "var(--color-body-muted)",
              }}>
              {entry.status === "failed"
                ? t("retro.summary.statusFailed")
                : t("retro.summary.statusPending")}
            </div>
          ) : null}

          {/* 회고 본문 — AI 요약(isSummary)도 편집 가능(PATCH /summaries/{id}) */}
          <section className="section-card">
            {!entry.isSummary && (
              <div className="section-card-head">
                <div className="avatar avatar-sm avatar-tile">
                  <BookOpen size={14} />
                </div>
                <p className="section-card-title">{t("retro.editor.learned")}</p>
              </div>
            )}
            <EditorErrorBoundary
              fallback={(error) => (
                <div
                  style={{
                    padding: 14,
                    fontSize: 13,
                    color: "var(--color-warn, #d9a23a)",
                    background: "var(--color-tile-3)",
                    borderRadius: "var(--r-sm)",
                    fontFamily: "var(--font-mono, monospace)",
                    whiteSpace: "pre-wrap",
                  }}>
                  <strong>에디터를 불러오지 못했습니다.</strong>
                  {"\n"}
                  {error.message}
                </div>
              )}>
              <Suspense
                fallback={
                  <div
                    style={{
                      minHeight: 260,
                      padding: 12,
                      fontSize: 13,
                      color: "var(--color-body-muted)",
                    }}>
                    에디터 로딩 중...
                  </div>
                }>
                <RichEditor
                  key={entry.id}
                  value={entry.content}
                  placeholder={t("retro.editor.learnedPlaceholder")}
                  onChange={(md) => onUpdate({ content: md })}
                />
              </Suspense>
            </EditorErrorBoundary>
          </section>
        </>
      )}

      {/* 확장 모드 — Portal */}
      {expanded &&
        createPortal(
          <div
            className="retro-expand-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setExpanded(false)
            }}>
            <div className="retro-expand-card">
              <div className="retro-expand-toolbar">
                <span className="retro-expand-hint">
                  Esc 또는 Ctrl+Shift+F 로 닫기
                </span>
                <button
                  type="button"
                  className="retro-expand-close"
                  onClick={() => setExpanded(false)}
                  aria-label="확장 닫기"
                  title="닫기 (Esc)">
                  <Minimize2 size={14} />
                  <X size={16} />
                </button>
              </div>
              <div className="retro-expand-body">
                <input
                  value={entry.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  readOnly={entry.isSummary}
                  title={entry.isSummary ? t("retro.summary.titleReadOnly") : undefined}
                  placeholder={t("retro.editor.titlePlaceholder")}
                  className="retro-title-input"
                />
                <div className="retro-expand-content-row">
                  <div className="retro-expand-main" ref={expandMainRef}>
                    <EditorErrorBoundary
                      fallback={(error) => (
                        <div
                          style={{
                            padding: 14,
                            fontSize: 13,
                            color: "var(--color-warn, #d9a23a)",
                            background: "var(--color-tile-3)",
                            borderRadius: "var(--r-sm)",
                            fontFamily: "var(--font-mono, monospace)",
                            whiteSpace: "pre-wrap",
                          }}>
                          <strong>에디터를 불러오지 못했습니다.</strong>
                          {"\n"}
                          {error.message}
                        </div>
                      )}>
                      <Suspense
                        fallback={
                          <div
                            style={{
                              minHeight: 260,
                              padding: 12,
                              fontSize: 13,
                              color: "var(--color-body-muted)",
                            }}>
                            에디터 로딩 중...
                          </div>
                        }>
                        <RichEditor
                          value={entry.content}
                          placeholder={t("retro.editor.learnedPlaceholder")}
                          onChange={(md) => onUpdate({ content: md })}
                        />
                      </Suspense>
                    </EditorErrorBoundary>
                  </div>

                  {/* Notion 스타일 목차 — 확장 모드에서만 노출, 헤딩이 있을 때만 렌더 */}
                  {headings.length > 0 ? (
                    <aside className="retro-expand-toc">
                      <p className="retro-expand-toc-title">{t("retro.toc.title")}</p>
                      {headings.map((h, i) => (
                        <button
                          key={i}
                          type="button"
                          className="retro-expand-toc-item"
                          style={{ paddingLeft: (h.level - 1) * 10 }}
                          onClick={() => scrollToHeading(i)}>
                          {h.text}
                        </button>
                      ))}
                    </aside>
                  ) : null}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* AI 요약 되돌리기 확인 */}
      {revertConfirmOpen ? (
        <ConfirmModal
          open
          title={t("retro.summary.revertConfirmTitle")}
          message={t("retro.summary.revertConfirmMessage")}
          confirmLabel={t("retro.summary.revertConfirm")}
          cancelLabel={t("retro.summary.revertCancel")}
          onConfirm={() => {
            setRevertConfirmOpen(false)
            onRevertSummary?.()
          }}
          onCancel={() => setRevertConfirmOpen(false)}
        />
      ) : null}
    </article>
  )
}
