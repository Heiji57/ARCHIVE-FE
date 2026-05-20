import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  GitCommit,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";
import { DEMO_ANCHOR_DATE_KEY } from "@/app/config/demo";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { getEntriesByRetroType } from "@/entities/entry/lib/selectors";
import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import type { SummaryKind } from "@/entities/summary/model/types";
import { Pill } from "@/shared/ui/pill/Pill";
import {
  formatFullDate,
  fromDateKey,
  getISOWeek,
} from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import type { TranslationKey } from "@/shared/lib/i18n";

const PAGE_SIZE = 8;

const RETRO_FILTERS: Array<{
  id: RetrospectiveType;
  labelKey: TranslationKey;
}> = [
  { id: "daily", labelKey: "retro.filter.daily" },
  { id: "weekly", labelKey: "retro.filter.weekly" },
  { id: "monthly", labelKey: "retro.filter.monthly" },
  { id: "yearly", labelKey: "retro.filter.yearly" },
];

const RETRO_LABEL_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "retro.filter.daily",
  weekly: "retro.filter.weekly",
  monthly: "retro.filter.monthly",
  yearly: "retro.filter.yearly",
};

const MOCK_COMMITS = [
  {
    repo: "archive-backend",
    message: "feat: add user auth api",
    sha: "a1b2c3d",
  },
  {
    repo: "archive-backend",
    message: "fix: redis connection timeout",
    sha: "f9e8d7c",
  },
] as const;

// ─── RetroEditor ─────────────────────────────────────────────────────────────

function RetroEditor({
  entry,
  completedTodos,
  githubConnectedAs,
  githubTargetRepo,
  isGithubConnected,
  onUpdate,
  onSave,
}: {
  entry: JournalEntry;
  completedTodos: { id: string; title: string }[];
  githubConnectedAs: string;
  githubTargetRepo: string;
  isGithubConnected: boolean;
  onUpdate: (patch: Partial<Pick<JournalEntry, "title" | "content">>) => void;
  onSave: () => void;
}) {
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
        <div className="disconnect-banner">
          <Lock size={14} style={{ color: "var(--color-warn)" }} />
          <span>{t("retro.github.notConnected")}</span>
        </div>
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

// ─── RetrospectiveStudio ─────────────────────────────────────────────────────

export function RetrospectiveStudio() {
  const { state, updateEntry, pushNotification, startSummary } =
    useArchiveApp();
  const { t } = useTranslation();
  const [retroFilter, setRetroFilter] = useState<RetrospectiveType>("daily");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const resetPage = () => setPage(0);

  const filteredEntries = useMemo(() => {
    const byType = getEntriesByRetroType(state.entries, retroFilter);
    const q = search.toLowerCase().trim();

    let list = byType;

    if (yearFilter !== "all") {
      list = list.filter((e) => e.dateKey.startsWith(`${yearFilter}-`));
    }
    if (monthFilter !== "all") {
      list = list.filter((e) => e.dateKey.slice(5, 7) === monthFilter);
    }
    if (weekFilter !== "all") {
      list = list.filter((e) => {
        const w = getISOWeek(fromDateKey(e.dateKey));
        return String(w) === weekFilter;
      });
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.dateKey.includes(q) ||
          e.content.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [state.entries, retroFilter, search, yearFilter, monthFilter, weekFilter]);

  const allOfType = useMemo(
    () => getEntriesByRetroType(state.entries, retroFilter),
    [state.entries, retroFilter],
  );

  const years = useMemo(() => {
    const s = new Set(allOfType.map((e) => e.dateKey.slice(0, 4)));
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [allOfType]);
  const months = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  const weeks = useMemo(() => {
    const s = new Set(
      allOfType.map((e) => String(getISOWeek(fromDateKey(e.dateKey)))),
    );
    return Array.from(s).sort((a, b) => Number(a) - Number(b));
  }, [allOfType]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pageStart = page * PAGE_SIZE;
  const pageEntries = filteredEntries.slice(pageStart, pageStart + PAGE_SIZE);

  const [selectedId, setSelectedId] = useState<string | null>(
    () => filteredEntries[0]?.id ?? null,
  );

  const active =
    state.entries.find((e) => e.id === selectedId) ?? filteredEntries[0] ?? null;

  const completedTodos = useMemo(
    () =>
      active
        ? state.todos.filter(
            (todoItem) =>
              todoItem.dateKey === active.dateKey &&
              todoItem.status === "done",
          )
        : [],
    [state.todos, active],
  );

  const isGithubConnected = Boolean(
    state.githubConfig && state.githubConfig.enabled,
  );
  const githubConnectedAs = state.githubConfig?.connectedAs ?? "developer";
  const githubTargetRepo =
    state.githubConfig?.targetRepository ?? "archive-journal";

  const handleSave = () => {
    if (!active) return;
    if (!isGithubConnected) return;
    updateEntry(active.id, { synced: true });
    pushNotification(
      "success",
      t("retro.editor.synced"),
      `${active.title} · @${githubConnectedAs}/${githubTargetRepo}`,
      { category: "sync" },
    );
  };

  const handleSummarize = (kind: SummaryKind) => {
    const target = active?.dateKey ?? DEMO_ANCHOR_DATE_KEY;
    startSummary(kind, target);
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
          {t("retro.history")}
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
          {t("retro.archive")}
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 12,
            color: "var(--color-body-muted)",
            lineHeight: 1.5,
          }}
        >
          {t("retro.archiveDescription")}
        </p>

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
              onClick={() => {
                setRetroFilter(f.id);
                resetPage();
              }}
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
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <select
            className="select"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              resetPage();
            }}
            title={t("retro.filter.year")}
          >
            <option value="all">{t("retro.filter.allYears")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              resetPage();
            }}
            title={t("retro.filter.month")}
          >
            <option value="all">{t("retro.filter.allMonths")}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={weekFilter}
            onChange={(e) => {
              setWeekFilter(e.target.value);
              resetPage();
            }}
            title={t("retro.filter.week")}
          >
            <option value="all">{t("retro.filter.allWeeks")}</option>
            {weeks.map((w) => (
              <option key={w} value={w}>
                W{w}
              </option>
            ))}
          </select>
        </div>

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
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder={t("retro.search")}
            style={{ flex: 1, fontSize: 13, minWidth: 0 }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 420,
            overflow: "auto",
          }}
        >
          {pageEntries.length === 0 ? (
            <div className="dashed" style={{ height: 80, fontSize: 12 }}>
              {t("retro.empty")}
            </div>
          ) : (
            pageEntries.map((e) => {
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
                      <Pill
                        tone="blue"
                        style={{ fontSize: 10, padding: "3px 8px" }}
                      >
                        {t("retro.badge.today")}
                      </Pill>
                    ) : null}
                    {isDraft ? (
                      <Pill
                        tone="warn"
                        style={{ fontSize: 10, padding: "3px 8px" }}
                      >
                        {t("retro.badge.draft")}
                      </Pill>
                    ) : (
                      <Pill
                        tone="green"
                        style={{ fontSize: 10, padding: "3px 8px" }}
                      >
                        {t("retro.badge.synced")}
                      </Pill>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {totalPages > 1 ? (
          <div className="pager">
            <button
              type="button"
              className="pager-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={12} /> {t("retro.pager.prev")}
            </button>
            <span>
              {t("retro.pager.page", {
                current: page + 1,
                total: totalPages,
              })}
            </span>
            <button
              type="button"
              className="pager-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              {t("retro.pager.next")} <ChevronRight size={12} />
            </button>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <button
            type="button"
            className="btn btn-utility"
            onClick={() => handleSummarize("weekly")}
            style={{ fontSize: 12, padding: "8px 12px" }}
          >
            <Sparkles size={12} /> {t("retro.summarize.weekly")}
          </button>
          <button
            type="button"
            className="btn btn-utility"
            onClick={() => handleSummarize("monthly")}
            style={{ fontSize: 12, padding: "8px 12px" }}
          >
            <Sparkles size={12} /> {t("retro.summarize.monthly")}
          </button>
          <button
            type="button"
            className="btn btn-utility"
            onClick={() => handleSummarize("yearly")}
            style={{ fontSize: 12, padding: "8px 12px" }}
          >
            <Sparkles size={12} /> {t("retro.summarize.yearly")}
          </button>
        </div>
      </aside>

      <main>
        {active ? (
          <RetroEditor
            key={active.id}
            entry={active}
            completedTodos={completedTodos}
            githubConnectedAs={githubConnectedAs}
            githubTargetRepo={githubTargetRepo}
            isGithubConnected={isGithubConnected}
            onUpdate={(patch) => updateEntry(active.id, patch)}
            onSave={handleSave}
          />
        ) : (
          <div className="dashed" style={{ minHeight: 360 }}>
            {t("retro.empty")}
          </div>
        )}
      </main>
    </div>
  );
}
