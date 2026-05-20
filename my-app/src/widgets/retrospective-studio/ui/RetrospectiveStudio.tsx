import { useMemo, useState } from "react";
import { BookOpen, Check, CheckCircle, Clock, GitCommit, Search } from "lucide-react";
import { DEMO_ANCHOR_DATE_KEY } from "@/app/config/demo";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { getEntriesByRetroType } from "@/entities/entry/lib/selectors";
import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import { Pill } from "@/shared/ui/pill/Pill";
import { formatFullDate, fromDateKey } from "@/shared/lib/date";

const RETRO_FILTERS: Array<{ id: RetrospectiveType; label: string }> = [
  { id: "daily", label: "일간" },
  { id: "weekly", label: "주간" },
  { id: "monthly", label: "월간" },
  { id: "yearly", label: "연간" },
];

const RETRO_LABEL: Record<RetrospectiveType, string> = {
  daily: "Daily Retrospective",
  weekly: "Weekly Retrospective",
  monthly: "Monthly Retrospective",
  yearly: "Yearly Retrospective",
};

const MOCK_COMMITS = [
  { repo: "archive-backend", message: "feat: add user auth api", sha: "a1b2c3d" },
  { repo: "archive-backend", message: "fix: redis connection timeout", sha: "f9e8d7c" },
] as const;

// ─── RetroEditor ──────────────────────────────────────────────────────────────

function RetroEditor({
  entry,
  completedTodos,
  githubConnectedAs,
  githubTargetRepo,
  onUpdate,
  onSave,
}: {
  entry: JournalEntry;
  completedTodos: { id: string; title: string }[];
  githubConnectedAs: string;
  githubTargetRepo: string;
  onUpdate: (patch: Partial<Pick<JournalEntry, "title" | "content">>) => void;
  onSave: () => void;
}) {
  const d = fromDateKey(entry.dateKey);
  const retroLabel = RETRO_LABEL[entry.retroType] ?? "Retrospective";

  return (
    <article>
      {/* Editor header */}
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
          <p style={{ margin: 0, fontSize: 14, color: "var(--color-body-muted)" }}>
            {formatFullDate(d)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {entry.synced ? (
            <Pill tone="green">
              <Check size={10} /> GitHub에 동기화됨
            </Pill>
          ) : (
            <Pill tone="warn">
              <Clock size={10} /> 동기화 대기 중
            </Pill>
          )}
          <button
            type="button"
            onClick={onSave}
            className="btn btn-primary"
            style={{ padding: "10px 22px" }}
          >
            <GitCommit size={14} /> 저장 · 동기화
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        value={entry.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="제목을 적어주세요"
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
        오늘의 작업과 커밋, 배운 점을 한 흐름으로 묶어보세요.
      </p>

      {/* Completed Todos */}
      <section className="section-card" style={{ marginBottom: 16 }}>
        <div className="section-card-head">
          <div className="avatar avatar-sm avatar-done">
            <CheckCircle size={14} strokeWidth={2.6} />
          </div>
          <p className="section-card-title">완료한 작업 · Completed</p>
        </div>

        {completedTodos.length > 0 ? (
          <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {completedTodos.map((t) => (
              <li
                key={t.id}
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
                <CheckCircle size={14} style={{ color: "var(--color-status-done)" }} />
                <span style={{ flex: 1 }}>{t.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-body-muted)" }}>
            오늘 완료된 작업이 없습니다.
          </p>
        )}
      </section>

      {/* Commits */}
      <section className="section-card-tile-2" style={{ marginBottom: 16 }}>
        <div className="section-card-head">
          <div className="avatar avatar-sm avatar-primary">
            <GitCommit size={14} />
          </div>
          <p className="section-card-title">오늘의 커밋 · Commits</p>
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
              <span style={{ color: "var(--color-primary-on-dark)", fontWeight: 600 }}>
                {c.repo}
              </span>
              <span style={{ color: "var(--color-body-muted)" }}>:</span>
              <span style={{ flex: 1, minWidth: 200 }}>{c.message}</span>
              <span style={{ color: "var(--color-ink-muted-48)" }}>({c.sha})</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Learned */}
      <section className="section-card">
        <div className="section-card-head">
          <div className="avatar avatar-sm avatar-tile">
            <BookOpen size={14} />
          </div>
          <p className="section-card-title">배운 점과 아쉬운 점 · Learned</p>
        </div>
        <textarea
          value={entry.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="오늘 알게 된 것, 다음에 더 잘하고 싶은 것을 자유롭게 적어주세요."
          className="editor-area"
          style={{ minHeight: 260 }}
        />
      </section>
    </article>
  );
}

// ─── RetrospectiveStudio ──────────────────────────────────────────────────────

export function RetrospectiveStudio() {
  const { state, updateEntry, pushNotification } = useArchiveApp();
  const [retroFilter, setRetroFilter] = useState<RetrospectiveType>("daily");
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    const byType = getEntriesByRetroType(state.entries, retroFilter);
    const q = search.toLowerCase();
    const matched = q
      ? byType.filter(
          (e) => e.title.toLowerCase().includes(q) || e.dateKey.includes(q),
        )
      : byType;
    return [...matched].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [state.entries, retroFilter, search]);

  const [selectedId, setSelectedId] = useState<string | null>(
    () => filteredEntries[0]?.id ?? null,
  );

  const active =
    state.entries.find((e) => e.id === selectedId) ??
    filteredEntries[0] ??
    null;

  const completedTodos = useMemo(
    () =>
      active
        ? state.todos.filter(
            (t) => t.dateKey === active.dateKey && t.status === "done",
          )
        : [],
    [state.todos, active],
  );

  const githubConnectedAs = state.githubConfig?.connectedAs ?? "developer";
  const githubTargetRepo =
    state.githubConfig?.targetRepository ?? "archive-journal";

  const handleSave = () => {
    if (!active) return;
    updateEntry(active.id, { synced: true });
    pushNotification(
      "success",
      "GitHub에 동기화됨",
      `${active.title} · @${githubConnectedAs}/${githubTargetRepo}`,
    );
  };

  return (
    <div
      className="page"
      style={{
        paddingTop: 32,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 32,
      }}
    >
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        style={{
          background: "var(--color-tile-1)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-xl)",
          padding: "22px 18px 18px",
          height: "fit-content",
          position: "sticky",
          top: 200,
        }}
      >
        <p
          className="t-eyebrow"
          style={{ margin: "0 0 6px", color: "var(--color-body-muted)" }}
        >
          History
        </p>
        <h3
          style={{
            margin: "0 0 6px",
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          회고 아카이브
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 12,
            color: "var(--color-body-muted)",
            lineHeight: 1.5,
          }}
        >
          매일·매주·매월·매년의 흐름이 한 곳에 모입니다.
        </p>

        {/* Filter tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            background: "var(--color-tile-3)",
            borderRadius: "var(--r-pill)",
            padding: 3,
            marginBottom: 14,
          }}
        >
          {RETRO_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRetroFilter(f.id)}
              style={{
                padding: "7px 4px",
                borderRadius: "var(--r-pill)",
                fontSize: 12,
                fontWeight: 500,
                background:
                  retroFilter === f.id ? "var(--color-tile-4)" : "transparent",
                color:
                  retroFilter === f.id
                    ? "var(--color-ink)"
                    : "var(--color-body-muted)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "var(--color-tile-3)",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--color-divider-soft)",
            marginBottom: 14,
          }}
        >
          <Search size={14} style={{ color: "var(--color-body-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            style={{ flex: 1, fontSize: 13, minWidth: 0 }}
          />
        </div>

        {/* Entry list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 540,
            overflow: "auto",
          }}
        >
          {filteredEntries.length === 0 ? (
            <div className="dashed" style={{ height: 80, fontSize: 12 }}>
              해당 유형의 회고가 없습니다.
            </div>
          ) : (
            filteredEntries.map((e) => {
              const isActive = e.id === active?.id;
              const isToday = e.dateKey === DEMO_ANCHOR_DATE_KEY;
              const isDraft = !e.synced;

              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "var(--r-md)",
                    background: isActive
                      ? "var(--color-ink)"
                      : "var(--color-tile-2)",
                    color: isActive
                      ? "var(--color-canvas)"
                      : "var(--color-ink)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "-0.14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.title}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        color: isActive
                          ? "var(--color-ink-muted-48)"
                          : "var(--color-body-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {e.dateKey}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {isToday ? (
                      <Pill tone="blue" style={{ fontSize: 10, padding: "3px 8px" }}>
                        Today
                      </Pill>
                    ) : null}
                    {isDraft ? (
                      <Pill tone="warn" style={{ fontSize: 10, padding: "3px 8px" }}>
                        Draft
                      </Pill>
                    ) : (
                      <Pill tone="green" style={{ fontSize: 10, padding: "3px 8px" }}>
                        Synced
                      </Pill>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Editor ─────────────────────────────────── */}
      <main>
        {active ? (
          <RetroEditor
            key={active.id}
            entry={active}
            completedTodos={completedTodos}
            githubConnectedAs={githubConnectedAs}
            githubTargetRepo={githubTargetRepo}
            onUpdate={(patch) => updateEntry(active.id, patch)}
            onSave={handleSave}
          />
        ) : (
          <div className="dashed" style={{ minHeight: 360 }}>
            회고를 선택하세요.
          </div>
        )}
      </main>
    </div>
  );
}
