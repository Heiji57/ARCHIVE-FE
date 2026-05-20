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
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { useDraggable, useDropTarget } from "@/shared/lib/dnd";
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
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";

const DAY_ABBR_KEYS: TranslationKey[] = [
  "calendar.days.sun", "calendar.days.mon", "calendar.days.tue",
  "calendar.days.wed", "calendar.days.thu", "calendar.days.fri", "calendar.days.sat",
];

const DAY_FULL_KEYS: TranslationKey[] = [
  "calendar.days.sunday", "calendar.days.monday", "calendar.days.tuesday",
  "calendar.days.wednesday", "calendar.days.thursday", "calendar.days.friday", "calendar.days.saturday",
];

const TODO_DRAG_KIND = "todo";

type TodoPatch = Partial<
  Pick<Todo, "title" | "status" | "description" | "dateKey">
>;

// ─── DraggableTaskCard (week grid) ───────────────────────────────────────────

function DraggableTaskCard({
  todo,
  active,
  onSelect,
}: {
  todo: Todo;
  active: boolean;
  onSelect: () => void;
}) {
  const drag = useDraggable({ kind: TODO_DRAG_KIND, data: { id: todo.id } });
  return (
    <button
      type="button"
      onClick={onSelect}
      data-draggable="true"
      {...drag}
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

function DraggableMonthChip({
  todo,
  onSelect,
}: {
  todo: Todo;
  onSelect: () => void;
}) {
  const drag = useDraggable({ kind: TODO_DRAG_KIND, data: { id: todo.id } });
  return (
    <button
      type="button"
      onClick={onSelect}
      data-draggable="true"
      {...drag}
      style={{
        textAlign: "left",
        fontSize: 11,
        padding: "3px 6px",
        borderRadius: 4,
        background:
          todo.status === "done"
            ? "var(--color-tile-3)"
            : todo.status === "in-progress"
              ? "rgba(10, 132, 255, 0.16)"
              : "var(--color-tile-2)",
        color:
          todo.status === "done"
            ? "var(--color-body-muted)"
            : todo.status === "in-progress"
              ? "var(--color-primary-on-dark)"
              : "var(--color-ink)",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        textDecoration: todo.status === "done" ? "line-through" : "none",
        width: "100%",
      }}
    >
      {todo.title}
    </button>
  );
}

// ─── DayCell (drop target wrapper) ───────────────────────────────────────────

function DayCell({
  dateKey,
  onDropTodo,
  children,
  style,
}: {
  dateKey: string;
  onDropTodo: (todoId: string, dateKey: string) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { ref, isOver, isActive } = useDropTarget<typeof TODO_DRAG_KIND>(
    TODO_DRAG_KIND,
    (payload) => {
      const data = payload.data as { id: string };
      onDropTodo(data.id, dateKey);
    },
  );

  return (
    <div
      ref={ref}
      data-drop-active={isActive}
      data-drop-over={isOver}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── WeekGrid ────────────────────────────────────────────────────────────────

function WeekGrid({
  cursor,
  byDate,
  selectedId,
  onSelect,
  onDropTodo,
}: {
  cursor: Date;
  byDate: Record<string, Todo[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropTodo: (todoId: string, dateKey: string) => void;
}) {
  const { t } = useTranslation();
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
          <DayCell
            key={k}
            dateKey={k}
            onDropTodo={onDropTodo}
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
                  {t(DAY_ABBR_KEYS[d.getDay()])}
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
                  {t(DAY_FULL_KEYS[d.getDay()])}
                </p>
              </div>
              {todayCell ? (
                <Pill tone="blue" style={{ fontSize: 10 }}>
                  {t("calendar.today")}
                </Pill>
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item) => (
                <DraggableTaskCard
                  key={item.id}
                  todo={item}
                  active={selectedId === item.id}
                  onSelect={() => onSelect(item.id)}
                />
              ))}

              <button
                type="button"
                className="dashed"
                style={{ padding: "10px 12px", fontSize: 12, gap: 4 }}
              >
                <Plus size={12} /> {t("calendar.addCard")}
              </button>
            </div>
          </DayCell>
        );
      })}
    </div>
  );
}

// ─── MonthGrid ───────────────────────────────────────────────────────────────

function MonthGrid({
  cursor,
  byDate,
  onSelect,
  onDropTodo,
}: {
  cursor: Date;
  byDate: Record<string, Todo[]>;
  onSelect: (id: string) => void;
  onDropTodo: (todoId: string, dateKey: string) => void;
}) {
  const cells = getMonthGrid(cursor);
  const anchorKey = toDateKey(DEMO_ANCHOR_DATE);
  const { t } = useTranslation();

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 8,
        }}
      >
        {DAY_ABBR_KEYS.map((key, i) => (
          <div
            key={i}
            style={{
              padding: "8px 4px",
              fontSize: 11,
              letterSpacing: "0.18em",
              fontWeight: 600,
              textTransform: "uppercase",
              color: i === 0 ? "var(--color-warn)" : "var(--color-body-muted)",
            }}
          >
            {t(key)}
          </div>
        ))}
      </div>

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
            <DayCell
              key={k}
              dateKey={k}
              onDropTodo={onDropTodo}
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
                    {t("calendar.today")}
                  </span>
                ) : null}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {visible.map((item) => (
                  <DraggableMonthChip
                    key={item.id}
                    todo={item}
                    onSelect={() => onSelect(item.id)}
                  />
                ))}
                {more > 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--color-body-muted)",
                    }}
                  >
                    {t("calendar.moreItems", { n: more })}
                  </p>
                ) : null}
              </div>
            </DayCell>
          );
        })}
      </div>
    </div>
  );
}

// ─── TaskDetailPanel ─────────────────────────────────────────────────────────

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
  const { t } = useTranslation();
  const d = fromDateKey(todo.dateKey);
  const STATUS_LABEL: Record<TaskStatus, string> = {
    "not-start": t("todo.col.notStart.ko"),
    "in-progress": t("todo.col.inProgress.ko"),
    done: t("todo.col.done.ko"),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
            {t("calendar.taskDetail.title")}
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
        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.status")}
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
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <StatusIcon status={todo.status} size={16} />
                {STATUS_LABEL[todo.status]}
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
                      {STATUS_LABEL[s]}
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.titleField")}
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

        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.date")}
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

        <div>
          <p
            className="t-eyebrow"
            style={{ margin: "0 0 8px", color: "var(--color-body-muted)" }}
          >
            {t("calendar.taskDetail.description")}
          </p>
          <textarea
            value={todo.description ?? ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="editor-area"
            style={{ minHeight: 160, fontSize: 14 }}
            placeholder={t("calendar.taskDetail.descPlaceholder")}
          />
        </div>

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
                {t("calendar.taskDetail.aiRetro")}
              </p>
              <p
                style={{
                  margin: "4px 0 12px",
                  fontSize: 12,
                  color: "var(--color-body-muted)",
                  lineHeight: 1.5,
                }}
              >
                {t("calendar.taskDetail.aiRetroDesc")}
              </p>
              <button
                type="button"
                onClick={onGoToRetro}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                {t("calendar.taskDetail.goToRetro")} <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CalendarDashboard ───────────────────────────────────────────────────────

export function CalendarDashboard({
  onNavigate,
}: {
  onNavigate: (route: AppRoute) => void;
}) {
  const { state, updateTodo, moveTodo } = useArchiveApp();
  const { t } = useTranslation();
  const [view, setView] = useState<"week" | "month">("week");
  const [cursor, setCursor] = useState(DEMO_ANCHOR_DATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTodo = selectedId
    ? findTodoById(state.todos, selectedId)
    : null;

  const byDate = useMemo(() => {
    const m: Record<string, Todo[]> = {};
    for (const item of state.todos) {
      if (!m[item.dateKey]) m[item.dateKey] = [];
      m[item.dateKey].push(item);
    }
    return m;
  }, [state.todos]);

  const navigate = (dir: -1 | 1) => {
    if (view === "week") {
      setCursor((prev) => addDays(prev, dir * 7));
    } else {
      setCursor(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 15, 12),
      );
    }
  };

  const handleDropTodo = (todoId: string, dateKey: string) => {
    moveTodo(todoId, dateKey);
  };

  return (
    <div>
      <div className="page" style={{ paddingTop: 40 }}>
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
                {t("calendar.view.week")}
              </button>
              <button
                type="button"
                className="seg-btn"
                aria-pressed={view === "month"}
                onClick={() => setView("month")}
              >
                {t("calendar.view.month")}
              </button>
            </div>
            <h2 className="t-display-md" style={{ margin: 0 }}>
              {formatMonthLabel(cursor)}
            </h2>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => navigate(-1)}
            >
              {t("calendar.nav.prev")}
            </button>
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => setCursor(DEMO_ANCHOR_DATE)}
            >
              {t("calendar.nav.today")}
            </button>
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => navigate(1)}
            >
              {t("calendar.nav.next")}
            </button>
          </div>
        </div>

        {view === "week" ? (
          <WeekGrid
            cursor={cursor}
            byDate={byDate}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDropTodo={handleDropTodo}
          />
        ) : (
          <MonthGrid
            cursor={cursor}
            byDate={byDate}
            onSelect={setSelectedId}
            onDropTodo={handleDropTodo}
          />
        )}

        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 28,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={legendItemStyle}>
              <Circle
                size={14}
                style={{ color: "var(--color-ink-muted-48)" }}
              />
              {t("calendar.legend.notStart")}
            </span>
            <span style={legendItemStyle}>
              <PlayCircle size={14} style={{ color: "var(--color-primary)" }} />
              {t("calendar.legend.inProgress")}
            </span>
            <span style={legendItemStyle}>
              <CheckCircle2
                size={14}
                style={{ color: "var(--color-status-done)" }}
              />
              {t("calendar.legend.done")}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`side-panel-overlay ${selectedId ? "open" : ""}`}
        onClick={() => setSelectedId(null)}
      />

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
