import { DEMO_ANCHOR_DATE } from "@/app/config/demo";
import type { Todo } from "@/entities/todo/model/types";
import {
  getMonthGrid,
  isSameMonth,
  toDateKey,
} from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { DAY_ABBR_KEYS } from "../model/constants";
import { DayCell } from "./DayCell";
import { DraggableMonthChip } from "./DraggableMonthChip";

export interface MonthGridProps {
  cursor: Date;
  byDate: Record<string, Todo[]>;
  onSelect: (id: string) => void;
  onDropTodo: (todoId: string, dateKey: string) => void;
}

export function MonthGrid({
  cursor,
  byDate,
  onSelect,
  onDropTodo,
}: MonthGridProps) {
  const { t } = useTranslation();
  const cells = getMonthGrid(cursor);
  const anchorKey = toDateKey(DEMO_ANCHOR_DATE);

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
