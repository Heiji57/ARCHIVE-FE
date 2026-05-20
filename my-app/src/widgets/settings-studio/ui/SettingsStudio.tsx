import { useState } from "react";
import {
  Check,
  ChevronDown,
  FolderGit2,
  GitCommit,
  GripVertical,
  Hash,
  ListTodo,
  Plus,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { TrackedRepository } from "@/entities/github/model/types";
import { Pill } from "@/shared/ui/pill/Pill";

type BlockType = "heading" | "var" | "text";
interface TemplateBlock {
  id: string;
  type: BlockType;
  text: string;
}

const INITIAL_BLOCKS: TemplateBlock[] = [
  { id: "b1", type: "heading", text: "오늘 완료한 일" },
  { id: "b2", type: "var", text: "{{todos}}" },
  { id: "b3", type: "heading", text: "오늘의 커밋" },
  { id: "b4", type: "var", text: "{{commits}}" },
  { id: "b5", type: "text", text: "배운 점과 아쉬운 점을 자유롭게 적어주세요." },
];

const TARGET_REPOS = ["archive-journal", "dev-log", "personal-site"] as const;

// ─── GithubCard ───────────────────────────────────────────────────────────────

function GithubCard({
  connectedAs,
  permissions,
  targetRepository,
  trackedRepositories,
  onUpdateTarget,
  onToggleRepo,
  onToast,
}: {
  connectedAs: string;
  permissions: string[];
  targetRepository: string;
  trackedRepositories: TrackedRepository[];
  onUpdateTarget: (repo: string) => void;
  onToggleRepo: (id: string) => void;
  onToast: (msg: string) => void;
}) {
  return (
    <section className="settings-card">
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div className="avatar avatar-md avatar-ink">
          <FolderGit2 size={20} />
        </div>
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 4px", color: "var(--color-body-muted)" }}
          >
            Integration
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
      </div>

      {/* Connected info row */}
      <div
        style={{
          background: "var(--color-tile-3)",
          borderRadius: "var(--r-lg)",
          padding: "16px 18px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          className="avatar"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--color-canvas)",
            border: "1px solid var(--color-divider-soft)",
          }}
        >
          <FolderGit2 size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.18px",
            }}
          >
            @{connectedAs}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 11,
              color: "var(--color-body-muted)",
            }}
          >
            {permissions.join(" · ")}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-utility"
          style={{ padding: "8px 16px", fontSize: 13 }}
          onClick={() => onToast("연결 해제는 시뮬레이션입니다.")}
        >
          Disconnect
        </button>
      </div>

      {/* Target repository */}
      <div style={{ marginBottom: 18 }}>
        <p
          className="t-eyebrow"
          style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
        >
          Target Repository · 회고 저장소
        </p>
        <div style={{ position: "relative" }}>
          <select
            value={targetRepository}
            onChange={(e) => {
              onUpdateTarget(e.target.value);
              onToast(`대상 리포가 ${e.target.value}로 변경되었습니다.`);
            }}
            style={{
              width: "100%",
              appearance: "none",
              padding: "12px 40px 12px 16px",
              borderRadius: "var(--r-md)",
              background: "var(--color-tile-3)",
              border: "1px solid var(--color-divider-soft)",
              fontSize: 14,
              color: "var(--color-ink)",
              colorScheme: "dark",
            }}
          >
            {TARGET_REPOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "var(--color-body-muted)",
            }}
          />
        </div>
      </div>

      {/* Tracked repositories */}
      <div>
        <p
          className="t-eyebrow"
          style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
        >
          Tracked Repositories · 추적 대상
        </p>
        <div
          style={{
            background: "var(--color-tile-3)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--color-divider-soft)",
            overflow: "hidden",
          }}
        >
          {trackedRepositories.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--color-divider-soft)",
              }}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={r.enabled}
                onClick={() => onToggleRepo(r.id)}
                className="cb"
                style={{ flexShrink: 0 }}
              >
                {r.enabled ? <Check size={12} /> : null}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "-0.14px",
                  }}
                >
                  {r.name}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11,
                    color: "var(--color-body-muted)",
                  }}
                >
                  @{connectedAs}/{r.name}
                </p>
              </div>

              {r.enabled ? (
                <Pill tone="blue" style={{ fontSize: 11 }}>
                  tracking
                </Pill>
              ) : (
                <Pill tone="outline" style={{ fontSize: 11 }}>
                  paused
                </Pill>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AIRetroCard ──────────────────────────────────────────────────────────────

function AIRetroCard({
  autoEnabled,
  onToggleAuto,
}: {
  autoEnabled: boolean;
  onToggleAuto: (v: boolean) => void;
}) {
  const [blocks, setBlocks] = useState<TemplateBlock[]>(INITIAL_BLOCKS);
  const [hovered, setHovered] = useState<string | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);

  const updateBlock = (id: string, text: string) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  const removeBlock = (id: string) =>
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  const addBlock = (type: BlockType) => {
    const id = "b" + Math.random().toString(36).slice(2, 6);
    const newBlock: TemplateBlock =
      type === "var"
        ? { id, type: "var", text: "{{variable}}" }
        : type === "heading"
          ? { id, type: "heading", text: "새 헤더" }
          : { id, type: "text", text: "새로운 텍스트 블록" };
    setBlocks((prev) => [...prev, newBlock]);
    setSlashOpen(false);
  };

  return (
    <section className="settings-card">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <div className="avatar avatar-md avatar-primary">
          <Sparkles size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 4px", color: "var(--color-body-muted)" }}
          >
            Automation
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
            AI Auto-Retrospective
          </h3>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoEnabled}
          onClick={() => onToggleAuto(!autoEnabled)}
          className="ios-toggle"
          aria-label="AI Auto-Retrospective"
        />
      </div>

      {/* Info banner */}
      <div
        style={{
          background: "rgba(10, 132, 255, 0.08)",
          border: "1px solid rgba(10, 132, 255, 0.18)",
          borderRadius: "var(--r-md)",
          padding: "12px 14px",
          marginBottom: 20,
          fontSize: 13,
          color: "var(--color-body)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <Sparkles
          size={14}
          style={{
            color: "var(--color-primary)",
            marginTop: 2,
            flexShrink: 0,
          }}
        />
        <span>
          매주 일요일 자정 · 매월 말일 · 매년 12/31에 자동 요약을 생성하고,
          우상단 토스트로 알려드립니다.
        </span>
      </div>

      <p
        className="t-eyebrow"
        style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
      >
        Template Editor · 템플릿 편집
      </p>

      <div
        style={{
          background: "var(--color-tile-2)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--color-divider-soft)",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {blocks.map((b) => (
            <div
              key={b.id}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "6px 6px",
                borderRadius: "var(--r-sm)",
                background:
                  hovered === b.id ? "var(--color-tile-3)" : "transparent",
                position: "relative",
              }}
            >
              <span
                style={{
                  opacity: hovered === b.id ? 1 : 0,
                  cursor: "grab",
                  color: "var(--color-ink-muted-48)",
                  paddingTop: b.type === "heading" ? 6 : 4,
                  transition: "opacity 120ms",
                  flexShrink: 0,
                }}
              >
                <GripVertical size={14} />
              </span>

              {b.type === "heading" ? (
                <input
                  value={b.text}
                  onChange={(e) => updateBlock(b.id, e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: 17,
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.2px",
                    padding: "4px 6px",
                    color: "var(--color-ink)",
                  }}
                />
              ) : b.type === "var" ? (
                <span
                  className="t-mono"
                  style={{
                    padding: "6px 10px",
                    borderRadius: "var(--r-xs)",
                    background: "rgba(10, 132, 255, 0.14)",
                    color: "var(--color-primary-on-dark)",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {b.text}
                </span>
              ) : (
                <input
                  value={b.text}
                  onChange={(e) => updateBlock(b.id, e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    padding: "6px 6px",
                    color: "var(--color-body-muted)",
                  }}
                />
              )}

              {hovered === b.id ? (
                <button
                  type="button"
                  onClick={() => removeBlock(b.id)}
                  className="btn-icon"
                  style={{ width: 24, height: 24, flexShrink: 0 }}
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div style={{ position: "relative", marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setSlashOpen((o) => !o)}
            style={{
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: "var(--r-sm)",
              background: "var(--color-tile-3)",
              color: "var(--color-body-muted)",
              fontSize: 12,
              border: "1px dashed var(--color-ink-muted-32)",
            }}
          >
            <Plus size={12} /> 슬래시 커맨드 · /
          </button>

          {slashOpen ? (
            <>
              <div
                onClick={() => setSlashOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 9 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  zIndex: 10,
                  background: "var(--color-tile-2)",
                  border: "1px solid var(--color-divider-soft)",
                  borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-toast)",
                  width: 240,
                  padding: 6,
                }}
              >
                {[
                  { type: "heading" as BlockType, label: "헤더 / Heading", icon: <Hash size={11} /> },
                  { type: "text" as BlockType, label: "텍스트 / Text", icon: <Type size={11} /> },
                  { type: "var" as BlockType, label: "할 일 변수 / {{todos}}", icon: <ListTodo size={11} /> },
                  { type: "var" as BlockType, label: "커밋 변수 / {{commits}}", icon: <GitCommit size={11} /> },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => addBlock(o.type)}
                    style={{
                      width: "100%",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "var(--r-xs)",
                      fontSize: 13,
                      color: "var(--color-ink)",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--color-tile-3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: "var(--color-tile-3)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-body-muted)",
                      }}
                    >
                      {o.icon}
                    </span>
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── SettingsStudio ───────────────────────────────────────────────────────────

export function SettingsStudio() {
  const { state, saveGitHubConfig, pushNotification } = useArchiveApp();
  const githubConfig = state.githubConfig;

  if (!githubConfig) {
    return (
      <div className="page" style={{ paddingTop: 32 }}>
        <div className="dashed" style={{ minHeight: 320 }}>
          GitHub 설정이 없습니다.
        </div>
      </div>
    );
  }

  const connectedAs = githubConfig.connectedAs ?? "developer";
  const permissions = githubConfig.permissions ?? [
    "Read Commits",
    "Write to Repositories",
  ];
  const targetRepo = githubConfig.targetRepository ?? "archive-journal";
  const trackedRepos = githubConfig.trackedRepositories ?? [];
  const autoEnabled = githubConfig.autoRetrospectiveEnabled ?? false;
  const lastSynced = githubConfig.lastSyncedAt
    ? new Date(githubConfig.lastSyncedAt).toLocaleString("ko-KR")
    : "없음";

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      {/* Hero card */}
      <section
        style={{
          background: "var(--color-tile-2)",
          borderRadius: "var(--r-xl)",
          padding: "32px 36px",
          marginBottom: 32,
          border: "1px solid var(--color-divider-soft)",
          display: "flex",
          gap: 32,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <p className="t-eyebrow" style={{ margin: "0 0 10px" }}>
            Service Controls
          </p>
          <h2 className="t-display-md" style={{ margin: "0 0 8px" }}>
            연결과 자동화를 한 자리에서
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              color: "var(--color-body-muted)",
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            GitHub 동기화 범위와, AI가 자동으로 그려줄 회고 템플릿을 조정합니다.
          </p>
        </div>

        <div
          className="glow"
          style={{
            width: 220,
            height: 132,
            borderRadius: "var(--r-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            letterSpacing: "0.18em",
            flexShrink: 0,
          }}
        >
          <span className="t-mono">SERVICE&nbsp;ATLAS</span>
        </div>
      </section>

      {/* Settings cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 24,
        }}
      >
        <GithubCard
          connectedAs={connectedAs}
          permissions={permissions}
          targetRepository={targetRepo}
          trackedRepositories={trackedRepos}
          onUpdateTarget={(repo) =>
            saveGitHubConfig({ ...githubConfig, targetRepository: repo })
          }
          onToggleRepo={(id) =>
            saveGitHubConfig({
              ...githubConfig,
              trackedRepositories: trackedRepos.map((r) =>
                r.id === id ? { ...r, enabled: !r.enabled } : r,
              ),
            })
          }
          onToast={(msg) => pushNotification("success", "저장 완료", msg)}
        />

        <AIRetroCard
          autoEnabled={autoEnabled}
          onToggleAuto={(v) => {
            saveGitHubConfig({ ...githubConfig, autoRetrospectiveEnabled: v });
            pushNotification(
              v ? "success" : "warning",
              v ? "자동 회고 활성화됨" : "자동 회고 비활성화됨",
              v
                ? "매주 일요일 0시에 주간 요약이 생성됩니다."
                : "수동으로 회고를 작성해 주세요.",
            );
          }}
        />
      </div>

      <p
        style={{
          marginTop: 40,
          fontSize: 12,
          color: "var(--color-ink-muted-48)",
          textAlign: "center",
        }}
      >
        모든 설정은 입력 즉시 저장됩니다. 마지막 동기화: {lastSynced}.
      </p>
    </div>
  );
}
