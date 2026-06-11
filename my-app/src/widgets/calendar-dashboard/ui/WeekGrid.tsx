import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { Todo } from "@/entities/todo/model/types";
import { Pill } from "@/shared/ui/pill/Pill";
import { addDays, startOfWeek, toDateKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { DAY_ABBR_KEYS, DAY_FULL_KEYS } from "../model/constants";
import { DayCell } from "./DayCell";
import { DraggableTaskCard } from "./DraggableTaskCard";

export interface WeekGridProps {
  cursor: Date;
  byDate: Record<string, Todo[]>;
  /** "오늘" 로 강조할 날짜 키 (실제 오늘 또는 데모 앵커). */
  todayKey: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropTodo: (todoId: string, dateKey: string) => void;
  onAddTodo: (title: string, dateKey: string) => void;
}

export function WeekGrid({
  cursor,
  byDate,
  todayKey,
  selectedId,
  onSelect,
  onDropTodo,
  onAddTodo,
}: WeekGridProps) {
  const { t } = useTranslation();
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const anchorKey = todayKey;

  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [addingTitle, setAddingTitle] = useState("");
  // Escape 키로 취소한 경우 blur 에서 submit 하지 않도록 플래그.
  const escapedRef = useRef(false);

  const startAdding = (dateKey: string) => {
    escapedRef.current = false;
    setAddingDate(dateKey);
    setAddingTitle("");
  };

  const commitAdd = () => {
    if (addingTitle.trim() && addingDate) {
      onAddTodo(addingTitle.trim(), addingDate);
    }
    setAddingDate(null);
    setAddingTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      escapedRef.current = false;
      commitAdd();
    } else if (e.key === "Escape") {
      escapedRef.current = true;
      setAddingDate(null);
      setAddingTitle("");
    }
  };

  const handleBlur = () => {
    if (escapedRef.current) {
      escapedRef.current = false;
      return;
    }
    commitAdd();
  };

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
        const isAdding = addingDate === k;

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

              {isAdding ? (
                <input
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  value={addingTitle}
                  onChange={(e) => setAddingTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  placeholder={t("calendar.addCard.placeholder")}
                  style={{
                    width: "100%",
                    fontSize: 12,
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--color-tile-3)",
                    border: "1px solid var(--color-primary)",
                    color: "var(--color-ink)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="dashed"
                  style={{ padding: "10px 12px", fontSize: 12, gap: 4 }}
                  onClick={() => startAdding(k)}
                >
                  <Plus size={12} /> {t("calendar.addCard")}
                </button>
              )}
            </div>
          </DayCell>
        );
      })}
    </div>
  );
}
