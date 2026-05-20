import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { getVisibleBoardTodos } from "@/entities/todo/lib/selectors";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { Pill, type PillTone } from "@/shared/ui/pill/Pill";
import {
  addDays,
  addMonths,
  endOfWeek,
  formatYearMonth,
  fromDateKey,
  getMonthGrid,
  startOfMonth,
  startOfWeek,
  toDateKey,
  todayKey,
} from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import type { TranslationKey } from "@/shared/lib/i18n";

const EN_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const COLS: Array<{
  id: TaskStatus;
  labelKey: TranslationKey;
  koKey: TranslationKey;
  tone: PillTone;
}> = [
  {
    id: "not-start",
    labelKey: "todo.col.notStart.label",
    koKey: "todo.col.notStart.ko",
    tone: "ghost",
  },
  {
    id: "in-progress",
    labelKey: "todo.col.inProgress.label",
    koKey: "todo.col.inProgress.ko",
    tone: "blue",
  },
  {
    id: "done",
    labelKey: "todo.col.done.label",
    koKey: "todo.col.done.ko",
    tone: "green",
  },
];

// ─── DatePickerPopover (month-navigable) ─────────────────────────────────────

interface DatePickerPopoverProps {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  anchorRight?: boolean;
}

function DatePickerPopover({
  value,
  onChange,
  onClose,
  anchorRight = true,
}: DatePickerPopoverProps) {
  const { t } = useTranslation();
  const today = new Date();
  const seedDate = value ? fromDateKey(value) : today;
  const [cursor, setCursor] = useState(startOfMonth(seedDate));

  const monthDays = useMemo(() => getMonthGrid(cursor), [cursor]);
  const monthLabel = formatYearMonth(cursor);

  const quickOptions = [
    { v: toDateKey(today), label: t("todo.quick.today") },
    { v: toDateKey(addDays(today, 1)), label: t("todo.quick.tomorrow") },
    { v: toDateKey(addDays(today, 5)), label: t("todo.quick.weekend") },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 30 }}
      />
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: anchorRight ? 0 : undefined,
          left: anchorRight ? undefined : 0,
          zIndex: 31,
          background: "var(--color-tile-2)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-lg)",
          padding: 12,
          width: 320,
          boxShadow: "var(--shadow-toast)",
        }}
      >
        <p
          className="t-eyebrow"
          style={{ margin: "4px 8px 8px", color: "var(--color-body-muted)" }}
        >
          {t("todo.picker.quickDate")}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginBottom: 8,
          }}
        >
          {quickOptions.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--r-sm)",
                textAlign: "left",
                fontSize: 13,
                background: o.v === value ? "var(--color-tile-4)" : "transparent",
                color: "var(--color-ink)",
              }}
            >
              {o.label}{" "}
              <span
                style={{
                  color: "var(--color-body-muted)",
                  marginLeft: 6,
                  fontSize: 11,
                }}
              >
                {o.v}
              </span>
            </button>
          ))}
        </div>

        {/* Month header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "8px 6px",
          }}
        >
          <button
            type="button"
            aria-label={t("todo.picker.prev")}
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="btn-icon"
            style={{ width: 28, height: 28 }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{monthLabel}</span>
          <button
            type="button"
            aria-label={t("todo.picker.next")}
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="btn-icon"
            style={{ width: 28, height: 28 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day-of-week header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            margin: "0 0 4px",
          }}
        >
          {EN_DAYS.map((d, i) => (
            <span
              key={i}
              style={{
                textAlign: "center",
                fontSize: 10,
                color: "var(--color-body-muted)",
              }}
            >
              {d}
            </span>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {monthDays.map((d) => {
            const k = toDateKey(d);
            const sel = k === value;
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <button
                key={k}
                type="button"
                onClick={() => onChange(k)}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: "var(--r-sm)",
                  background: sel
                    ? "var(--color-primary)"
                    : "var(--color-tile-3)",
                  color: sel
                    ? "#fff"
                    : inMonth
                      ? "var(--color-ink)"
                      : "var(--color-ink-muted-48)",
                  fontSize: 12,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  todo: Todo;
  isDone: boolean;
  onUpdate: (
    id: string,
    patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>,
  ) => void;
}

function KanbanCard({ todo, isDone, onUpdate }: KanbanCardProps) {
  const { t } = useTranslation();
  const [dateOpen, setDateOpen] = useState(false);

  const advance = () => {
    const next: TaskStatus =
      todo.status === "not-start"
        ? "in-progress"
        : todo.status === "in-progress"
          ? "done"
          : "not-start";
    onUpdate(todo.id, { status: next });
  };

  return (
    <div
      style={{
        background: isDone ? "var(--color-tile-3)" : "var(--color-tile-2)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--color-divider-soft)",
        padding: "12px 14px 14px 10px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <button
        type="button"
        onClick={advance}
        title={t("todo.card.advance")}
        style={{ marginTop: 2, flexShrink: 0 }}
      >
        <StatusIcon status={todo.status} size={16} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.16px",
            textDecoration: isDone ? "line-through" : "none",
            color: isDone ? "var(--color-body-muted)" : "var(--color-ink)",
          }}
        >
          {todo.title}
        </p>

        {todo.description ? (
          <p
            style={{
              margin: "4px 0 8px",
              fontSize: 12,
              color: "var(--color-body-muted)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {todo.description}
          </p>
        ) : (
          <div style={{ height: 4 }} />
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", position: "relative" }}>
          <Pill
            tone="outline"
            as="button"
            onClick={() => setDateOpen((v) => !v)}
            title={t("todo.card.changeDate")}
          >
            <CalendarDays size={10} />
            {todo.dateKey}
          </Pill>
          <Pill tone="outline" as="button" onClick={advance}>
            <ArrowRight size={10} />
            {t("todo.card.nextStep")}
          </Pill>

          {dateOpen ? (
            <DatePickerPopover
              value={todo.dateKey}
              onChange={(v) => {
                onUpdate(todo.id, { dateKey: v });
                setDateOpen(false);
              }}
              onClose={() => setDateOpen(false)}
              anchorRight={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── KanbanColumn ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  col: (typeof COLS)[number];
  items: Todo[];
  onUpdate: KanbanCardProps["onUpdate"];
}

function KanbanColumn({ col, items, onUpdate }: KanbanColumnProps) {
  const { t } = useTranslation();
  const isDone = col.id === "done";
  const dotColor =
    col.id === "in-progress"
      ? "var(--color-primary)"
      : col.id === "done"
        ? "var(--color-status-done)"
        : "var(--color-ink-muted-48)";

  return (
    <section
      style={{
        background: isDone ? "var(--color-tile-2)" : "var(--color-tile-1)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--color-divider-soft)",
        padding: "20px 18px 22px",
        minHeight: 480,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          paddingInline: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dotColor,
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.2px",
              }}
            >
              {t(col.labelKey)}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--color-body-muted)",
              }}
            >
              {t(col.koKey)}
            </p>
          </div>
        </div>

        <Pill tone={col.tone}>{items.length}</Pill>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <div
            className="dashed"
            style={{
              height: 96,
              fontSize: 12,
              color: "var(--color-ink-muted-48)",
            }}
          >
            {t("todo.col.empty")}
          </div>
        ) : (
          items.map((todoItem) => (
            <KanbanCard
              key={todoItem.id}
              todo={todoItem}
              onUpdate={onUpdate}
              isDone={isDone}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ─── TodoBoard ───────────────────────────────────────────────────────────────

type DateFilter =
  | { kind: "all" }
  | { kind: "today" }
  | { kind: "week" }
  | { kind: "specific"; dateKey: string };

export function TodoBoard() {
  const { state, addTodo, updateTodo, pushNotification } = useArchiveApp();
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState(todayKey);
  const [filter, setFilter] = useState<DateFilter>({ kind: "all" });
  const [filterDateOpen, setFilterDateOpen] = useState(false);

  // Re-tick periodically so 24h-hide updates without manual refresh.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const today = new Date();
  const todayK = toDateKey(today);
  const tomorrowK = toDateKey(addDays(today, 1));

  const pickedLabel =
    pickedDate === todayK
      ? t("todo.quick.today")
      : pickedDate === tomorrowK
        ? t("todo.quick.tomorrow")
        : pickedDate;

  const filteredTodos = useMemo(() => {
    const visible = getVisibleBoardTodos(state.todos);
    if (filter.kind === "all") return visible;
    if (filter.kind === "today")
      return visible.filter((t) => t.dateKey === todayK);
    if (filter.kind === "week") {
      const ws = startOfWeek(today).getTime();
      const we = endOfWeek(today).getTime();
      return visible.filter((t) => {
        const x = fromDateKey(t.dateKey).getTime();
        return x >= ws && x <= we;
      });
    }
    return visible.filter((t) => t.dateKey === filter.dateKey);
  }, [state.todos, filter, todayK, today]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Todo[]> = {
      "not-start": [],
      "in-progress": [],
      done: [],
    };
    for (const item of filteredTodos) {
      g[item.status]?.push(item);
    }
    return g;
  }, [filteredTodos]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    addTodo(input.trim(), pickedDate, { status: "not-start" });
    pushNotification(
      "success",
      t("todo.notif.added.title"),
      `"${input.trim()}" — ${pickedDate}`,
    );
    setInput("");
  };

  const filterDateAnchor = useRef<HTMLDivElement | null>(null);

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      {/* Quick Capture */}
      <section
        style={{
          background: "var(--color-tile-1)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-xl)",
          padding: "28px 32px",
          marginBottom: 28,
        }}
      >
        <form
          onSubmit={submit}
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 280,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              background: "var(--color-tile-3)",
              borderRadius: "var(--r-pill)",
              border: "1px solid var(--color-divider-soft)",
            }}
          >
            <Sparkles
              size={18}
              style={{ color: "var(--color-primary)", flexShrink: 0 }}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("todo.quickCapture.placeholder")}
              style={{ flex: 1, fontSize: 16, minWidth: 0 }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setPickerOpen((p) => !p)}
              className="btn btn-utility"
              style={{ padding: "11px 18px" }}
            >
              <CalendarDays size={14} />
              {pickedLabel}
              <ChevronDown size={12} />
            </button>

            {pickerOpen ? (
              <DatePickerPopover
                value={pickedDate}
                onChange={(v) => {
                  setPickedDate(v);
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            ) : null}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "12px 24px" }}
          >
            {t("todo.quickCapture.enter")} <ArrowRight size={14} />
          </button>
        </form>

        <p
          style={{
            margin: "14px 0 0",
            fontSize: 13,
            color: "var(--color-body-muted)",
          }}
        >
          {t("todo.quickCapture.hint")}
        </p>
      </section>

      {/* Filter row */}
      <div className="todo-filter-row">
        <button
          type="button"
          className="todo-filter-btn"
          data-active={filter.kind === "all"}
          onClick={() => setFilter({ kind: "all" })}
        >
          {t("todo.filter.all")}
        </button>
        <button
          type="button"
          className="todo-filter-btn"
          data-active={filter.kind === "today"}
          onClick={() => setFilter({ kind: "today" })}
        >
          {t("todo.filter.today")}
        </button>
        <button
          type="button"
          className="todo-filter-btn"
          data-active={filter.kind === "week"}
          onClick={() => setFilter({ kind: "week" })}
        >
          {t("todo.filter.thisWeek")}
        </button>
        <div style={{ position: "relative" }} ref={filterDateAnchor}>
          <button
            type="button"
            className="todo-filter-btn"
            data-active={filter.kind === "specific"}
            onClick={() => setFilterDateOpen((v) => !v)}
          >
            <CalendarDays size={11} style={{ marginRight: 4 }} />
            {filter.kind === "specific"
              ? filter.dateKey
              : t("todo.filter.pickDate")}
          </button>
          {filterDateOpen ? (
            <DatePickerPopover
              value={filter.kind === "specific" ? filter.dateKey : todayK}
              onChange={(v) => {
                setFilter({ kind: "specific", dateKey: v });
                setFilterDateOpen(false);
              }}
              onClose={() => setFilterDateOpen(false)}
              anchorRight={false}
            />
          ) : null}
        </div>
        {filter.kind !== "all" ? (
          <button
            type="button"
            className="todo-filter-btn"
            onClick={() => setFilter({ kind: "all" })}
          >
            {t("todo.filter.clear")}
          </button>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 20,
        }}
      >
        {COLS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            items={grouped[col.id]}
            onUpdate={updateTodo}
          />
        ))}
      </div>
    </div>
  );
}
