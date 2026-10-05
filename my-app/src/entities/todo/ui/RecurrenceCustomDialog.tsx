import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CalendarDays } from "lucide-react";
import type { MonthWeek, RecurrenceRule, Weekday } from "@/entities/todo/model/types";
import {
  formatRecurrenceRule,
  monthDayLabel,
  monthWeekLabel,
  monthWeekOptions,
  normalizeRecurrenceRule,
  weekdayName,
  weekdayOf,
} from "@/entities/todo/lib/recurrence";
import { useTranslation } from "@/shared/lib/i18n";
import { DatePickerPopover } from "./DatePickerPopover";

export interface RecurrenceCustomDialogProps {
  /** 기준일(시작일) — 월간 n번째·연간 월/일·기본 요일이 여기서 나온다. */
  dateKey: string;
  /** 현재 규칙(있으면 그 값으로 채워 연다). null = 매주 기준일 요일로 시작. */
  initial: RecurrenceRule | null;
  onConfirm: (rule: RecurrenceRule) => void;
  onCancel: () => void;
}

type Unit = RecurrenceRule["unit"];

const UNITS: Unit[] = ["day", "week", "month", "year"];
const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const UNIT_KEYS = {
  day: "todo.recurrence.custom.unit.day",
  week: "todo.recurrence.custom.unit.week",
  month: "todo.recurrence.custom.unit.month",
  year: "todo.recurrence.custom.unit.year",
} as const;

const labelStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.04em",
  color: "var(--color-body-muted)",
};

const fieldStyle: CSSProperties = {
  minHeight: 44,
  boxSizing: "border-box",
  padding: "8px 10px",
  borderRadius: "var(--r-md)",
  background: "var(--color-tile-3)",
  border: "1px solid var(--color-divider-soft)",
  color: "var(--color-ink)",
  fontSize: 16,
};

const hintBoxStyle: CSSProperties = {
  margin: 0,
  padding: "10px 12px",
  borderRadius: "var(--r-md)",
  background: "var(--color-chip-translucent)",
  fontSize: 16,
  color: "var(--color-ink-muted-80)",
};

/**
 * "맞춤…" 반복 설정 모달 — [숫자][일|주|개월|년] 마다, 주 단위면 반복 요일(복수), 종료(없음/날짜).
 * 취소·바깥 클릭·Esc 는 아무 것도 바꾸지 않고, "완료" 에서만 onConfirm 으로 확정한다.
 * RecurrenceScopeDialog 와 같은 portal + 오버레이 + Esc 패턴.
 */
export function RecurrenceCustomDialog({
  dateKey,
  initial,
  onConfirm,
  onCancel,
}: RecurrenceCustomDialogProps) {
  const { t, locale } = useTranslation();
  const startWeekday = weekdayOf(dateKey);
  const monthOptions = monthWeekOptions(dateKey);
  const seed = initial
    ? normalizeRecurrenceRule(initial, dateKey)
    : ({ unit: "week", interval: 1, until: null, weekdays: [startWeekday] } as RecurrenceRule);

  const [everyN, setEveryN] = useState(seed.interval);
  const [unit, setUnit] = useState<Unit>(seed.unit);
  const [weekdays, setWeekdays] = useState<Weekday[]>(seed.weekdays ?? [startWeekday]);
  const [monthWeek, setMonthWeek] = useState<MonthWeek>(
    seed.monthWeek && monthOptions.includes(seed.monthWeek) ? seed.monthWeek : monthOptions[0],
  );
  const [until, setUntil] = useState<string | null>(seed.until);
  const [untilPickerOpen, setUntilPickerOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  const rule: RecurrenceRule = {
    unit,
    interval: everyN,
    until,
    ...(unit === "week" ? { weekdays: [...weekdays].sort((a, b) => a - b) } : {}),
    ...(unit === "month" ? { monthWeek } : {}),
  };
  const invalid = unit === "week" && weekdays.length === 0;
  const startWeekdayLong = weekdayName(startWeekday, locale, "long");

  const toggleWeekday = (d: Weekday) =>
    setWeekdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurrence-custom-title"
        style={{
          width: "100%",
          maxWidth: 380,
          boxSizing: "border-box",
          background: "var(--color-tile-2)",
          border: "1px solid var(--color-hairline-strong)",
          borderRadius: "var(--r-lg)",
          padding: 24,
          boxShadow: "var(--shadow-toast)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <p id="recurrence-custom-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--color-ink)" }}>
          {t("todo.recurrence.custom.title")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="recurrence-custom-interval" style={labelStyle}>
            {t("todo.recurrence.custom.every")}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {t("todo.recurrence.custom.prefix") ? (
              <span style={{ fontSize: 16, color: "var(--color-body-muted)" }}>
                {t("todo.recurrence.custom.prefix")}
              </span>
            ) : null}
            <input
              id="recurrence-custom-interval"
              type="number"
              min={1}
              max={365}
              value={everyN}
              onChange={(e) => {
                const n = Math.trunc(Number(e.target.value));
                setEveryN(Number.isFinite(n) ? Math.min(365, Math.max(1, n)) : 1);
              }}
              style={{ ...fieldStyle, width: 72 }}
            />
            <select
              aria-label={t("todo.recurrence.custom.every")}
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              style={{ ...fieldStyle, flex: 1 }}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(UNIT_KEYS[u])}
                </option>
              ))}
            </select>
            {t("todo.recurrence.custom.suffix") ? (
              <span style={{ fontSize: 16, color: "var(--color-body-muted)" }}>
                {t("todo.recurrence.custom.suffix")}
              </span>
            ) : null}
          </div>
        </div>

        {unit === "week" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={labelStyle}>{t("todo.recurrence.custom.weekdays")}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
              {WEEKDAYS.map((d) => {
                const on = weekdays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleWeekday(d)}
                    aria-pressed={on}
                    aria-label={weekdayName(d, locale, "long")}
                    style={{
                      height: 40,
                      padding: 0,
                      borderRadius: 999,
                      border: `1px solid ${on ? "var(--color-primary)" : "var(--color-hairline)"}`,
                      background: on ? "var(--color-primary)" : "var(--color-tile-3)",
                      color: on ? "var(--color-on-primary)" : "var(--color-ink-muted-80)",
                      fontSize: 16,
                    }}
                  >
                    {weekdayName(d, locale, "short")}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {unit === "month" ? (
          monthOptions.length > 1 ? (
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {monthOptions.map((mw) => (
                <label key={mw} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
                  <input
                    type="radio"
                    name="recurrence-month-week"
                    checked={monthWeek === mw}
                    onChange={() => setMonthWeek(mw)}
                  />
                  {t("todo.recurrence.custom.monthOption", {
                    nth: monthWeekLabel(mw, t),
                    weekday: startWeekdayLong,
                  })}
                </label>
              ))}
            </fieldset>
          ) : (
            <p style={hintBoxStyle}>
              {t("todo.recurrence.custom.monthHint", {
                nth: monthWeekLabel(monthOptions[0], t),
                weekday: startWeekdayLong,
              })}
            </p>
          )
        ) : null}

        {unit === "year" ? (
          <p style={hintBoxStyle}>
            {t("todo.recurrence.custom.yearHint", {
              date: monthDayLabel(dateKey, locale),
            })}
          </p>
        ) : null}

        <fieldset style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <legend style={{ ...labelStyle, padding: 0, marginBottom: 8 }}>{t("todo.recurrence.custom.end")}</legend>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
            <input type="radio" name="recurrence-end" checked={until === null} onChange={() => setUntil(null)} />
            {t("todo.recurrence.until.none")}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
              <input
                type="radio"
                name="recurrence-end"
                checked={until !== null}
                onChange={() => setUntil((u) => u ?? dateKey)}
              />
              {t("todo.recurrence.until.date")}
            </label>
            {until !== null ? (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setUntilPickerOpen((o) => !o)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--color-tile-3)",
                    border: "1px solid var(--color-divider-soft)",
                    color: "var(--color-ink)",
                    fontSize: 16,
                  }}
                >
                  <CalendarDays size={13} />
                  {until}
                </button>
                {untilPickerOpen ? (
                  <DatePickerPopover
                    value={until}
                    anchorRight={false}
                    onChange={(v) => {
                      setUntil(v);
                      setUntilPickerOpen(false);
                    }}
                    onClose={() => setUntilPickerOpen(false)}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </fieldset>

        <p style={{ margin: 0, fontSize: 12, color: "var(--color-body-muted)" }}>
          {t("todo.recurrence.custom.preview")} ·{" "}
          <span style={{ color: "var(--color-ink-muted-80)" }}>
            {invalid ? "—" : formatRecurrenceRule(rule, dateKey, t, locale)}
          </span>
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t("todo.recurrence.scope.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={invalid}
            onClick={() => onConfirm(rule)}
            style={{ opacity: invalid ? 0.4 : 1 }}
          >
            {t("todo.recurrence.done")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
