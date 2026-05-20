import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { Pill, type PillTone } from "@/shared/ui/pill/Pill";
import { addDays, toDateKey, todayKey } from "@/shared/lib/date";

const EN_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const COLS: Array<{
  id: TaskStatus;
  label: string;
  ko: string;
  tone: PillTone;
}> = [
  { id: "not-start", label: "Not Started", ko: "시작 전", tone: "ghost" },
  { id: "in-progress", label: "In Progress", ko: "진행 중", tone: "blue" },
  { id: "done", label: "Done", ko: "완료", tone: "green" },
];

// ─── DatePickerPopover ───────────────────────────────────────────────────────

interface DatePickerPopoverProps {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

function DatePickerPopover({ value, onChange, onClose }: DatePickerPopoverProps) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const quickOptions = [
    { v: toDateKey(today), label: "오늘" },
    { v: toDateKey(addDays(today, 1)), label: "내일" },
    { v: toDateKey(addDays(today, 5)), label: "이번 주말" },
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
          right: 0,
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
          Quick Date
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 }}>
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
              <span style={{ color: "var(--color-body-muted)", marginLeft: 6, fontSize: 11 }}>
                {o.v}
              </span>
            </button>
          ))}
        </div>

        <p
          className="t-eyebrow"
          style={{ margin: "8px 8px 6px", color: "var(--color-body-muted)" }}
        >
          Calendar
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((d) => {
            const k = toDateKey(d);
            const sel = k === value;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onChange(k)}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: "var(--r-sm)",
                  background: sel ? "var(--color-primary)" : "var(--color-tile-3)",
                  color: sel ? "#fff" : "var(--color-ink)",
                  fontSize: 12,
                  fontWeight: 500,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.6 }}>{EN_DAYS[d.getDay()]}</span>
                <span>{d.getDate()}</span>
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
  onUpdate: (id: string, patch: Partial<Pick<Todo, "title" | "status" | "description" | "dateKey">>) => void;
}

function KanbanCard({ todo, isDone, onUpdate }: KanbanCardProps) {
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
        title="상태 변경"
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

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill tone="outline">
            <CalendarDays size={10} />
            {todo.dateKey}
          </Pill>
          <Pill tone="outline" as="button" onClick={advance}>
            <ArrowRight size={10} />
            다음 단계
          </Pill>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  col: (typeof COLS)[number];
  items: Todo[];
  onUpdate: KanbanCardProps["onUpdate"];
}

function KanbanColumn({ col, items, onUpdate }: KanbanColumnProps) {
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
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px" }}>
              {col.label}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-body-muted)" }}>
              {col.ko}
            </p>
          </div>
        </div>

        <Pill tone={col.tone}>{items.length}</Pill>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <div
            className="dashed"
            style={{ height: 96, fontSize: 12, color: "var(--color-ink-muted-48)" }}
          >
            아직 이 열에 배치된 카드가 없습니다.
          </div>
        ) : (
          items.map((t) => (
            <KanbanCard key={t.id} todo={t} onUpdate={onUpdate} isDone={isDone} />
          ))
        )}
      </div>
    </section>
  );
}

// ─── TodoBoard ────────────────────────────────────────────────────────────────

export function TodoBoard() {
  const { state, addTodo, updateTodo, pushNotification } = useArchiveApp();
  const [input, setInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState(todayKey);

  const today = new Date();
  const todayK = toDateKey(today);
  const tomorrowK = toDateKey(addDays(today, 1));

  const pickedLabel =
    pickedDate === todayK
      ? "오늘"
      : pickedDate === tomorrowK
        ? "내일"
        : pickedDate;

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Todo[]> = {
      "not-start": [],
      "in-progress": [],
      done: [],
    };
    for (const t of state.todos) {
      g[t.status]?.push(t);
    }
    return g;
  }, [state.todos]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    addTodo(input.trim(), pickedDate, { status: "not-start" });
    pushNotification(
      "success",
      "할 일 추가됨",
      `"${input.trim()}" — ${pickedDate}`,
    );
    setInput("");
  };

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      {/* Quick Capture */}
      <section
        style={{
          background: "var(--color-tile-1)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-xl)",
          padding: "28px 32px",
          marginBottom: 40,
        }}
      >
        <form
          onSubmit={submit}
          style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}
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
            <Sparkles size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="자연어로 적어보세요 — 예: 내일까지 API 캐시 정리"
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

          <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }}>
            Enter <ArrowRight size={14} />
          </button>
        </form>

        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--color-body-muted)" }}>
          입력하는 순간 칸반에 정렬됩니다. 날짜를 비워두면 오늘로 추가합니다.
        </p>
      </section>

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
