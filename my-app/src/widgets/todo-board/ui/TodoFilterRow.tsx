import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import type { DateFilter } from "../model/constants";
import { DatePickerPopover } from "./DatePickerPopover";

export interface TodoFilterRowProps {
  filter: DateFilter;
  onChange: (next: DateFilter) => void;
  todayKey: string;
}

/**
 * `[전체][오늘][이번 주][날짜 선택]` filter chip row above the kanban grid.
 */
export function TodoFilterRow({ filter, onChange, todayKey }: TodoFilterRowProps) {
  const { t } = useTranslation();
  const [filterDateOpen, setFilterDateOpen] = useState(false);
  const filterDateAnchor = useRef<HTMLDivElement | null>(null);

  return (
    <div className="todo-filter-row">
      <button
        type="button"
        className="todo-filter-btn"
        data-active={filter.kind === "all"}
        onClick={() => onChange({ kind: "all" })}
      >
        {t("todo.filter.all")}
      </button>
      <button
        type="button"
        className="todo-filter-btn"
        data-active={filter.kind === "today"}
        onClick={() => onChange({ kind: "today" })}
      >
        {t("todo.filter.today")}
      </button>
      <button
        type="button"
        className="todo-filter-btn"
        data-active={filter.kind === "week"}
        onClick={() => onChange({ kind: "week" })}
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
            value={filter.kind === "specific" ? filter.dateKey : todayKey}
            onChange={(v) => {
              onChange({ kind: "specific", dateKey: v });
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
          onClick={() => onChange({ kind: "all" })}
        >
          {t("todo.filter.clear")}
        </button>
      ) : null}
    </div>
  );
}
