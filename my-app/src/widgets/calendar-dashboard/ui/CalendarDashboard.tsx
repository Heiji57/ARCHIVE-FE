import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { DEMO_ANCHOR_DATE } from "@/app/config/demo";
import type { AppRoute } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { findTodoById } from "@/entities/todo/lib/selectors";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { STATUS_LABELS, StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { Pill } from "@/shared/ui/pill/Pill";
import {
  addDays,
  formatFullDate,
  formatMonthLabel,
  fromDateKey,
  getMonthGrid,
  isSameMonth,
  startOfWeek,
  toDateKey,
} from "@/shared/lib/date";

const EN_DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const KO_DAYS = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

type TodoPatch = Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>;

// ─── TaskCard (week grid) ─────────────────────────────────────────────────────

function TaskCard({
  todo,
  active,
  onSelect,
}: {
  todo: Todo;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        background: active ? "var(--color-tile-4)" : "var(--color-tile-2)",
        border:
          "1px solid " +
          (active ? "var(--color-primary)" : "var(--color-divider-soft)"),
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        transition: "background 120ms, border-color 120ms",
        width: "100%",
      }}
    >
      <div style={{ flex: "0 0 18px", marginTop: 2 }}>
        <StatusIcon status={todo.status} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.16px",
            textDecoration: todo.status === "done" ? "line-through" : "none",
            color:
              todo.status === "done"
                ? "var(--color-body-muted)"
                : "var(--color-ink)",
          }}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "var(--color-body-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {todo.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

// ─── WeekGrid ─────────────────────────────────────────────────────────────────

function WeekGrid({
  cursor,
  byDate,
  selectedId,
  onSelect,
}: {
  cursor: Date;
  byDate: Record<string, Todo[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const anchorKey = toDateKey(DEMO_ANCHOR_DATE);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gap: 1,
        background: "var(--color-divider-soft)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        border: "1px solid var(--color-divider-soft)",
      }}
    >
      {days.map((d) => {
        const k = toDateKey(d);
        const todayCell = k === anchorKey;
        const items = byDate[k] ?? [];

        return (
          <div
            key={k}
            style={{
              background: todayCell
                ? "rgba(10, 132, 255, 0.07)"
                : "var(--color-tile-1)",
              minHeight: 380,
              padding: "16px 14px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Day header */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  className="t-eyebrow"
                  style={{
                    color: todayCell
                      ? "var(--color-primary-on-dark)"
                      : "var(--color-body-muted)",
                    margin: 0,
                  }}
                >
                  {EN_DAYS[d.getDay()]}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 26,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    color: "var(--color-ink)",
                  }}
                >
                  {d.getDate()}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "var(--color-body-muted)",
                  }}
                >
                  {KO_DAYS[d.getDay()]}
                </p>
              </div>
              {todayCell ? (
                <Pill tone="blue" style={{ fontSize: 10 }}>
                  TODAY
                </Pill>
              ) : null}
            </div>

            {/* Task cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  todo={t}
                  active={selectedId === t.id}
                  onSelect={() => onSelect(t.id)}
                />
              ))}

              <button
                type="button"
                className="dashed"
                style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  gap: 4,
                }}
              >
                <Plus size={12} /> 새 카드
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MonthGrid ────────────────────────────────────────────────────────────────

function MonthGrid({
  cursor,
  byDate,
  onSelect,
}: {
  cursor: Date;
  byDate: Record<string, Todo[]>;
  onSelect: (id: string) => void;
}) {
  const cells = getMonthGrid(cursor);
  const anchorKey = toDateKey(DEMO_ANCHOR_DATE);

  return (
    <div>
      {/* Day header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 8,
        }}
      >
        {EN_DAYS.map((d, i) => (
          <div
            key={i}
            style={{
              padding: "8px 4px",
              fontSize: 11,
              letterSpacing: "0.18em",
              fontWeight: 600,
              textTransform: "uppercase",
              color:
                i === 0 ? "var(--color-warn)" : "var(--color-body-muted)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          background: "var(--color-divider-soft)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          border: "1px solid var(--color-divider-soft)",
        }}
      >
        {cells.map((d) => {
          const k = toDateKey(d);
          const todayCell = k === anchorKey;
          const inMonth = isSameMonth(d, cursor);
          const items = byDate[k] ?? [];
          const visible = items.slice(0, 3);
          const more = items.length - visible.length;

          return (
            <div
              key={k}
              style={{
                background: todayCell
                  ? "rgba(10, 132, 255, 0.08)"
                  : "var(--color-tile-1)",
                minHeight: 124,
                padding: 10,
                opacity: inMonth ? 1 : 0.4,
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
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: todayCell
                      ? "var(--color-primary-on-dark)"
                      : "var(--color-ink)",
                  }}
                >
                  {d.getDate()}
                </span>
                {todayCell ? (
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      color: "var(--color-primary-on-dark)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    TODAY
                  </span>
                ) : null}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {visible.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelect(t.id)}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      padding: "3px 6px",
                      borderRadius: 4,
                      background:
                        t.status === "done"
                          ? "var(--color-tile-3)"
                          : t.status === "in-progress"
                            ? "rgba(10, 132, 255, 0.16)"
                            : "var(--color-tile-2)",
                      color:
                        t.status === "done"
                          ? "var(--color-body-muted)"
                          : t.status === "in-progress"
                            ? "var(--color-primary-on-dark)"
                            : "var(--color-ink)",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      textDecoration:
                        t.status === "done" ? "line-through" : "none",
                      width: "100%",
                    }}
                  >
                    {t.title}
                  </button>
                ))}
                {more > 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--color-body-muted)",
                    }}
                  >
                    +{more}개 더 보기
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TaskDetailPanel ──────────────────────────────────────────────────────────

function TaskDetailPanel({
  todo,
  onClose,
  onUpdate,
  onGoToRetro,
}: {
  todo: Todo;
  onClose: () => void;
  onUpdate: (patch: TodoPatch) => void;
  onGoToRetro: () => void;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const d = fromDateKey(todo.dateKey);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Panel header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--color-divider-soft)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            className="t-eyebrow"
            style={{ color: "var(--color-body-muted)", margin: 0 }}
          >
            Task Detail
          </p>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" className="btn-icon" aria-label="More">
              <MoreHorizontal size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: "var(--color-body-muted)",
          }}
        >
          {formatFullDate(d)}
        </p>
      </div>

      {/* Panel body */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Status */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            Status
          </p>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setStatusOpen((o) => !o)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "var(--r-md)",
                background: "var(--color-tile-3)",
                border: "1px solid var(--color-divider-soft)",
                color: "var(--color-ink)",
                fontSize: 14,
              }}
            >
              <span
                style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <StatusIcon status={todo.status} size={16} />
                {STATUS_LABELS[todo.status]}
              </span>
              <ChevronDown size={14} />
            </button>

            {statusOpen ? (
              <div
                style={{
                  marginTop: 6,
                  borderRadius: "var(--r-md)",
                  background: "var(--color-tile-3)",
                  border: "1px solid var(--color-divider-soft)",
                  overflow: "hidden",
                }}
              >
                {(["not-start", "in-progress", "done"] as TaskStatus[]).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onUpdate({ status: s });
                        setStatusOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        padding: "10px 14px",
                        fontSize: 14,
                        color: "var(--color-ink)",
                        background:
                          todo.status === s
                            ? "var(--color-tile-2)"
                            : "transparent",
                      }}
                    >
                      <StatusIcon status={s} size={14} />
                      {STATUS_LABELS[s]}
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            Title · 제목
          </p>
          <input
            value={todo.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            style={{
              width: "100%",
              fontSize: 20,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--color-tile-3)",
              border: "1px solid var(--color-divider-soft)",
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
            }}
          />
        </div>

        {/* Date */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            Date · 기간
          </p>
          <input
            type="date"
            value={todo.dateKey}
            onChange={(e) => onUpdate({ dateKey: e.target.value })}
            style={{
              width: "100%",
              fontSize: 14,
              padding: "11px 14px",
              borderRadius: "var(--r-md)",
              background: "var(--color-tile-3)",
              border: "1px solid var(--color-divider-soft)",
              colorScheme: "dark",
              color: "var(--color-ink)",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            Description · 상세 설명
          </p>
          <textarea
            value={todo.description ?? ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="editor-area"
            style={{ minHeight: 160, fontSize: 14 }}
            placeholder="작업의 맥락이나 참고 링크를 적어두세요."
          />
        </div>

        {/* AI Auto-Retrospective callout */}
        <div
          style={{
            padding: "16px 18px",
            borderRadius: "var(--r-md)",
            background:
              "linear-gradient(180deg, rgba(10, 132, 255, 0.14), rgba(10, 132, 255, 0.04))",
            border: "1px solid rgba(10, 132, 255, 0.28)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div className="avatar avatar-sm avatar-primary">
              <Sparkles size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.1px",
                }}
              >
                AI Auto-Retrospective
              </p>
              <p
                style={{
                  margin: "4px 0 12px",
                  fontSize: 12,
                  color: "var(--color-body-muted)",
                  lineHeight: 1.5,
                }}
              >
                이 작업의 진행 흐름을 회고에 묶어두면, 일요일에 자동으로 주간
                요약이 생성됩니다.
              </p>
              <button
                type="button"
                onClick={onGoToRetro}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                회고 에디터로 이동 <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CalendarDashboard ────────────────────────────────────────────────────────

export function CalendarDashboard({
  onNavigate,
}: {
  onNavigate: (route: AppRoute) => void;
}) {
  const { state, updateTodo } = useArchiveApp();
  const [view, setView] = useState<"week" | "month">("week");
  const [cursor, setCursor] = useState(DEMO_ANCHOR_DATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTodo = selectedId
    ? findTodoById(state.todos, selectedId)
    : null;

  const byDate = useMemo(() => {
    const m: Record<string, Todo[]> = {};
    for (const t of state.todos) {
      if (!m[t.dateKey]) m[t.dateKey] = [];
      m[t.dateKey].push(t);
    }
    return m;
  }, [state.todos]);

  const navigate = (dir: -1 | 1) => {
    if (view === "week") {
      setCursor((prev) => addDays(prev, dir * 7));
    } else {
      setCursor(
        (prev) =>
          new Date(prev.getFullYear(), prev.getMonth() + dir, 15, 12),
      );
    }
  };

  return (
    <div>
      <div className="page" style={{ paddingTop: 40 }}>
        {/* View toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="seg">
              <button
                type="button"
                className="seg-btn"
                aria-pressed={view === "week"}
                onClick={() => setView("week")}
              >
                1 Week
              </button>
              <button
                type="button"
                className="seg-btn"
                aria-pressed={view === "month"}
                onClick={() => setView("month")}
              >
                1 Month
              </button>
            </div>
            <h2 className="t-display-md" style={{ margin: 0 }}>
              {view === "week"
                ? `${formatMonthLabel(cursor)} · 이번 주`
                : formatMonthLabel(cursor)}
            </h2>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => navigate(-1)}
            >
              ← 이전
            </button>
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => setCursor(DEMO_ANCHOR_DATE)}
            >
              오늘로
            </button>
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => navigate(1)}
            >
              다음 →
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        {view === "week" ? (
          <WeekGrid
            cursor={cursor}
            byDate={byDate}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <MonthGrid
            cursor={cursor}
            byDate={byDate}
            onSelect={setSelectedId}
          />
        )}

        {/* Legend */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 28,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <p
            className="t-eyebrow"
            style={{ color: "var(--color-body-muted)", margin: 0 }}
          >
            Legend
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={legendItemStyle}>
              <Circle size={14} style={{ color: "var(--color-ink-muted-48)" }} />
              To Do · 시작 전
            </span>
            <span style={legendItemStyle}>
              <PlayCircle size={14} style={{ color: "var(--color-primary)" }} />
              In Progress · 진행 중
            </span>
            <span style={legendItemStyle}>
              <CheckCircle2
                size={14}
                style={{ color: "var(--color-status-done)" }}
              />
              Done · 완료
            </span>
          </div>
        </div>
      </div>

      {/* Slide panel overlay */}
      <div
        className={`side-panel-overlay ${selectedId ? "open" : ""}`}
        onClick={() => setSelectedId(null)}
      />

      {/* Slide panel */}
      <aside
        className={`side-panel ${selectedId ? "open" : ""}`}
        aria-hidden={!selectedId}
      >
        {selectedTodo ? (
          <TaskDetailPanel
            key={selectedTodo.id}
            todo={selectedTodo}
            onClose={() => setSelectedId(null)}
            onUpdate={(patch) => updateTodo(selectedTodo.id, patch)}
            onGoToRetro={() => {
              onNavigate("retrospectives");
              setSelectedId(null);
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}

const legendItemStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "var(--color-body-muted)",
} as const;
