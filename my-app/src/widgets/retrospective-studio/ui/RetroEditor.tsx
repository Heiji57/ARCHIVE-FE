import {
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  GitCommit,
  Lock,
} from "lucide-react";
import type { JournalEntry } from "@/entities/entry/model/types";
import { DisconnectBanner } from "@/shared/ui/disconnect-banner/DisconnectBanner";
import { Pill } from "@/shared/ui/pill/Pill";
import { formatFullDate, fromDateKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { MOCK_COMMITS, RETRO_LABEL_KEY } from "../model/constants";

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

      <input
        value={entry.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder={t("retro.editor.titlePlaceholder")}
        style={{
          width: "100%",
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 3.6vw, 3.5rem)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.08,
          marginBottom: 14,
          padding: "10px 0",
          color: "var(--color-ink)",
        }}
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
          <p className="section-card-title">{t("retro.editor.completed")}</p>
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

      {isGithubConnected ? (
        <section className="section-card-tile-2" style={{ marginBottom: 16 }}>
          <div className="section-card-head">
            <div className="avatar avatar-sm avatar-primary">
              <GitCommit size={14} />
            </div>
            <p className="section-card-title">{t("retro.editor.commits")}</p>
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
        <textarea
          value={entry.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder={t("retro.editor.learnedPlaceholder")}
          className="editor-area"
          style={{ minHeight: 260 }}
        />
      </section>
    </article>
  );
}
