import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  GitCommit,
  Lock,
  Maximize2,
  Minimize2,
  Save,
  X,
} from "lucide-react";
import type { JournalEntry } from "@/entities/entry/model/types";
import { DisconnectBanner } from "@/shared/ui/disconnect-banner/DisconnectBanner";
import { Pill } from "@/shared/ui/pill/Pill";
import { formatFullDate, fromDateKey, todayKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { EditorErrorBoundary } from "@/shared/ui/rich-editor";
import { MOCK_COMMITS, RETRO_LABEL_KEY } from "../model/constants";

// TipTap 에디터는 번들 크기가 크므로 회고록 페이지 진입 시에만 로드
const RichEditor = lazy(() => import("@/shared/ui/rich-editor/ui/RichEditor"));

export interface RetroEditorProps {
  entry: JournalEntry;
  completedTodos: { id: string; title: string }[];
  githubConnectedAs: string;
  githubTargetRepo: string;
  isGithubConnected: boolean;
  onUpdate: (patch: Partial<Pick<JournalEntry, "title" | "content">>) => void;
  onSave: () => void;
}

export function RetroEditor({
  entry,
  completedTodos,
  githubConnectedAs,
  githubTargetRepo,
  isGithubConnected,
  onUpdate,
  onSave,
}: RetroEditorProps) {
  const { t } = useTranslation();
  const d = fromDateKey(entry.dateKey);
  const retroLabel = t(RETRO_LABEL_KEY[entry.retroType]);
  // "오늘의 커밋" 섹션은 오늘 + daily 회고에만 표시
  const isTodayDaily =
    entry.retroType === "daily" && entry.dateKey === todayKey();

  // ─── 확장 모드 (제목 + 본문만 가운데 모달로) ──────────────────────────
  const [expanded, setExpanded] = useState(false);

  // Esc → 닫기, Ctrl/Cmd+Shift+F → 토글
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + F → 토글 (브라우저 Ctrl+F 검색과 안 겹침)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setExpanded((v) => !v);
        return;
      }
      if (expanded && e.key === "Escape") {
        e.preventDefault();
        setExpanded(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  // 확장 모드일 때 body scroll 잠금
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

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
        }}
      >
        <div>
          <p className="t-eyebrow" style={{ margin: "0 0 6px" }}>
            {retroLabel}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--color-body-muted)",
            }}
          >
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
            }}
          >
            <Save size={11} />
            {t("retro.editor.autoSaved")}
          </span>

          {/* 확장 버튼 */}
          <button
            type="button"
            className="retro-expand-btn"
            onClick={() => setExpanded(true)}
            aria-label="회고록 확장"
            title="회고록 확장 (Ctrl+Shift+F)"
          >
            <Maximize2 size={14} />
          </button>

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
          <button
            type="button"
            onClick={onSave}
            className="btn btn-primary"
            style={{ padding: "10px 22px" }}
            disabled={!isGithubConnected}
            title={
              !isGithubConnected ? t("retro.github.connectFromSettings") : ""
            }
          >
            <GitCommit size={14} /> {t("retro.editor.save")}
          </button>
        </div>
      </div>

      {!isGithubConnected ? (
        <DisconnectBanner message={t("retro.github.notConnected")} />
      ) : null}

      {/* 일반 모드 — 제목 + 부가 정보 섹션들 + 본문 모두 표시 */}
      {!expanded && (
        <>
          <input
            value={entry.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={t("retro.editor.titlePlaceholder")}
            className="retro-title-input"
          />
          <p
            style={{
              margin: "0 0 32px",
              fontSize: 19,
              color: "var(--color-body-muted)",
              lineHeight: 1.4,
            }}
          >
            {t("retro.editor.sub")}
          </p>

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
                    }}
                  >
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
                }}
              >
                {t("retro.editor.noCompleted")}
              </p>
            )}
          </section>

          {isGithubConnected && isTodayDaily ? (
            <section
              className="section-card-tile-2"
              style={{ marginBottom: 16 }}
            >
              <div className="section-card-head">
                <div className="avatar avatar-sm avatar-primary">
                  <GitCommit size={14} />
                </div>
                <p className="section-card-title">
                  {t("retro.editor.commits")}
                </p>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: "var(--color-body-muted)",
                  }}
                >
                  @{githubConnectedAs}/{githubTargetRepo}
                </span>
              </div>

              <ul
                className="t-mono"
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                {MOCK_COMMITS.map((c) => (
                  <li
                    key={c.sha}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--r-sm)",
                      background: "var(--color-tile-3)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--color-primary-on-dark)",
                        fontWeight: 600,
                      }}
                    >
                      {c.repo}
                    </span>
                    <span style={{ color: "var(--color-body-muted)" }}>:</span>
                    <span style={{ flex: 1, minWidth: 200 }}>{c.message}</span>
                    <span style={{ color: "var(--color-ink-muted-48)" }}>
                      ({c.sha})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="section-card">
            <div className="section-card-head">
              <div className="avatar avatar-sm avatar-tile">
                <BookOpen size={14} />
              </div>
              <p className="section-card-title">{t("retro.editor.learned")}</p>
            </div>
            <EditorErrorBoundary
              fallback={(error) => (
                <div
                  style={{
                    padding: 14,
                    fontSize: 13,
                    color: "var(--color-warn, #ff9f0a)",
                    background: "var(--color-tile-3)",
                    borderRadius: "var(--r-sm)",
                    fontFamily: "var(--font-mono, monospace)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <strong>에디터를 불러오지 못했습니다.</strong>
                  {"\n"}
                  {error.message}
                </div>
              )}
            >
              <Suspense
                fallback={
                  <div
                    style={{
                      minHeight: 260,
                      padding: 12,
                      fontSize: 13,
                      color: "var(--color-body-muted)",
                    }}
                  >
                    에디터 로딩 중...
                  </div>
                }
              >
                <RichEditor
                  value={entry.content}
                  placeholder={t("retro.editor.learnedPlaceholder")}
                  onChange={(md) => onUpdate({ content: md })}
                />
              </Suspense>
            </EditorErrorBoundary>
          </section>
        </>
      )}

      {/* 확장 모드 — Portal로 body에 띄움. 제목 + 본문만 */}
      {expanded &&
        createPortal(
          <div
            className="retro-expand-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setExpanded(false);
            }}
          >
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
                  title="닫기 (Esc)"
                >
                  <Minimize2 size={14} />
                  <X size={16} />
                </button>
              </div>
              <div className="retro-expand-body">
                <input
                  value={entry.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder={t("retro.editor.titlePlaceholder")}
                  className="retro-title-input"
                />
                <EditorErrorBoundary
                  fallback={(error) => (
                    <div
                      style={{
                        padding: 14,
                        fontSize: 13,
                        color: "var(--color-warn, #ff9f0a)",
                        background: "var(--color-tile-3)",
                        borderRadius: "var(--r-sm)",
                        fontFamily: "var(--font-mono, monospace)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <strong>에디터를 불러오지 못했습니다.</strong>
                      {"\n"}
                      {error.message}
                    </div>
                  )}
                >
                  <Suspense
                    fallback={
                      <div
                        style={{
                          minHeight: 260,
                          padding: 12,
                          fontSize: 13,
                          color: "var(--color-body-muted)",
                        }}
                      >
                        에디터 로딩 중...
                      </div>
                    }
                  >
                    <RichEditor
                      value={entry.content}
                      placeholder={t("retro.editor.learnedPlaceholder")}
                      onChange={(md) => onUpdate({ content: md })}
                    />
                  </Suspense>
                </EditorErrorBoundary>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}
