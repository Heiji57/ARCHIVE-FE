import { useState } from "react";
import { X } from "lucide-react";
import type { Todo } from "@/entities/todo/model/types";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import {
  formatFullDate,
  fromDateKey,
  getMonthGrid,
  isSameMonth,
  toDateKey,
} from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { MONTH_HEADER_KEYS } from "../model/constants";
import { DayCell } from "./DayCell";
import { DraggableMonthChip } from "./DraggableMonthChip";

export interface MonthGridProps {
  cursor: Date;
  byDate: Record<string, Todo[]>;
  /** "오늘" 로 강조할 날짜 키 (실제 오늘 또는 데모 앵커). */
  todayKey: string;
  onSelect: (id: string) => void;
  onDropTodo: (todoId: string, dateKey: string) => void;
}

export function MonthGrid({
  cursor,
  byDate,
  todayKey,
  onSelect,
  onDropTodo,
}: MonthGridProps) {
  const { t, locale } = useTranslation();
  const cells = getMonthGrid(cursor);
  const anchorKey = todayKey;

  const [modalDate, setModalDate] = useState<string | null>(null);
  const modalTodos = modalDate ? (byDate[modalDate] ?? []) : [];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 8,
        }}
      >
        {MONTH_HEADER_KEYS.map((key, i) => (
          <div
            key={i}
            style={{
              padding: "8px 4px",
              fontSize: 11,
              letterSpacing: "0.18em",
              fontWeight: 600,
              textTransform: "uppercase",
              // Sunday is the last column (index 6) in the Monday-first grid.
              color: i === 6 ? "var(--color-warn)" : "var(--color-body-muted)",
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
          gap: 4,
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
                  ? "rgba(94, 106, 210, 0.06)"
                  : "var(--color-tile-1)",
                minHeight: 124,
                padding: 10,
                opacity: inMonth ? 1 : 0.35,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                borderRadius: "var(--r-sm)",
                border: todayCell
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-divider-soft)",
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
                  <button
                    type="button"
                    onClick={() => setModalDate(k)}
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--color-primary-on-dark)",
                      background: "transparent",
                      border: "none",
                      padding: "2px 0",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {t("calendar.moreItems", { n: more })}
                  </button>
                ) : null}
              </div>
            </DayCell>
          );
        })}
      </div>

      {/* "n개 더 보기" 모달 */}
      {modalDate ? (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.48)",
              zIndex: 200,
            }}
            onClick={() => setModalDate(null)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 201,
              width: 360,
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              background: "var(--color-tile-1)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-divider-soft)",
              boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
              overflow: "hidden",
            }}
          >
            {/* 헤더 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px 14px",
                borderBottom: "1px solid var(--color-divider-soft)",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                }}
              >
                {formatFullDate(fromDateKey(modalDate), locale)}
              </p>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setModalDate(null)}
                aria-label={t("calendar.taskDetail.close")}
              >
                <X size={16} />
              </button>
            </div>

            {/* 할 일 목록 */}
            <div
              style={{
                overflowY: "auto",
                padding: "12px 16px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {modalTodos.map((todo) => (
                <button
                  key={todo.id}
                  type="button"
                  onClick={() => {
                    onSelect(todo.id);
                    setModalDate(null);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--color-tile-2)",
                    border: "1px solid var(--color-divider-soft)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    color: "var(--color-ink)",
                  }}
                >
                  <StatusIcon status={todo.status} size={14} />
                  <span
                    style={{
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      flex: 1,
                      color:
                        todo.status === "done"
                          ? "var(--color-status-done)"
                          : "var(--color-ink)",
                    }}
                  >
                    {todo.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
