import { Plus } from "lucide-react";
import { DEMO_ANCHOR_DATE } from "@/app/config/demo";
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
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropTodo: (todoId: string, dateKey: string) => void;
}

export function WeekGrid({
  cursor,
  byDate,
  selectedId,
  onSelect,
  onDropTodo,
}: WeekGridProps) {
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
