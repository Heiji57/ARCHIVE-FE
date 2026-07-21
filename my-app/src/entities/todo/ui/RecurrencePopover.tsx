import { useState, type CSSProperties } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { RecurrenceRule } from "@/entities/todo/model/types";
import { toDateKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { DatePickerPopover } from "./DatePickerPopover";

export interface RecurrencePopoverProps {
  /** null = 반복 안함(단건). */
  value: RecurrenceRule | null;
  onChange: (v: RecurrenceRule | null) => void;
  onClose: () => void;
  /**
   * "반복 안함" 버튼 표시 여부 (기본 true).
   * 이미 반복 중인 시리즈의 규칙 변경(scope: following) 컨텍스트에서는 false 로 숨긴다 —
   * 서버가 following 스코프에서 recurrenceRule:null 을 "반복 중지"로 처리하지 않고
   * 기존 규칙을 그대로 유지하므로, 버튼이 암시하는 동작과 실제 동작이 달라 오해를 줄 수 있다.
   */
  showOffOption?: boolean;
}

export const DEFAULT_RECURRENCE_RULE: RecurrenceRule = { unit: "day", interval: 1, until: null };

const toggleBtnStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: "8px 10px",
  borderRadius: "var(--r-sm)",
  fontSize: 16,
  background: active ? "var(--color-primary)" : "var(--color-tile-3)",
  color: active ? "#fff" : "var(--color-ink)",
  border: "1px solid var(--color-divider-soft)",
});

/**
 * 반복 규칙(단위/간격/종료일) 설정 팝오버. QuickCapture 의 "반복" 칩에서 연다.
 * DatePickerPopover 와 같은 절대 위치·오버레이 패턴을 따른다.
 */
export function RecurrencePopover({
  value,
  onChange,
  onClose,
  showOffOption = true,
}: RecurrencePopoverProps) {
  const { t } = useTranslation();
  const rule = value ?? DEFAULT_RECURRENCE_RULE;
  const [untilPickerOpen, setUntilPickerOpen] = useState(false);
  const hasUntil = rule.until !== null;

  const setRule = (patch: Partial<RecurrenceRule>) => onChange({ ...rule, ...patch });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          zIndex: 31,
          background: "var(--color-tile-2)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-lg)",
          padding: 14,
          width: 280,
          boxShadow: "var(--shadow-toast)",
        }}
      >
        <p
          className="t-eyebrow"
          style={{ margin: "0 0 10px", color: "var(--color-body-muted)" }}
        >
          {t("todo.recurrence.title")}
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => setRule({ unit: "day" })}
            style={toggleBtnStyle(rule.unit === "day")}
          >
            {t("todo.recurrence.unit.day")}
          </button>
          <button
            type="button"
            onClick={() => setRule({ unit: "week" })}
            style={toggleBtnStyle(rule.unit === "week")}
          >
            {t("todo.recurrence.unit.week")}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16, color: "var(--color-body-muted)" }}>
            {t("todo.recurrence.every")}
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={rule.interval}
            onChange={(e) => {
              const n = Number(e.target.value);
              setRule({ interval: Number.isFinite(n) ? Math.min(365, Math.max(1, Math.trunc(n))) : 1 });
            }}
            style={{
              width: 56,
              padding: "6px 8px",
              borderRadius: "var(--r-sm)",
              background: "var(--color-tile-3)",
              border: "1px solid var(--color-divider-soft)",
              color: "var(--color-ink)",
              fontSize: 16,
            }}
          />
          <span style={{ fontSize: 16, color: "var(--color-body-muted)" }}>
            {rule.unit === "day" ? t("todo.recurrence.unitNoun.day") : t("todo.recurrence.unitNoun.week")}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
            <input type="radio" checked={!hasUntil} onChange={() => setRule({ until: null })} />
            {t("todo.recurrence.until.none")}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
            <input
              type="radio"
              checked={hasUntil}
              onChange={() => setRule({ until: rule.until ?? toDateKey(new Date()) })}
            />
            {t("todo.recurrence.until.date")}
          </label>
          {hasUntil ? (
            <div style={{ position: "relative", marginLeft: 24 }}>
              <button
                type="button"
                onClick={() => setUntilPickerOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  width: "calc(100% - 0px)",
                  padding: "6px 8px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--color-tile-3)",
                  border: "1px solid var(--color-divider-soft)",
                  color: "var(--color-ink)",
                  fontSize: 16,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <CalendarDays size={13} />
                  {rule.until ?? toDateKey(new Date())}
                </span>
                <ChevronDown size={12} />
              </button>
              {untilPickerOpen ? (
                <DatePickerPopover
                  value={rule.until ?? toDateKey(new Date())}
                  anchorRight={false}
                  onChange={(v) => {
                    setRule({ until: v });
                    setUntilPickerOpen(false);
                  }}
                  onClose={() => setUntilPickerOpen(false)}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          {showOffOption ? (
            <button
              type="button"
              className="btn btn-utility"
              onClick={() => {
                onChange(null);
                onClose();
              }}
              style={{ padding: "8px 12px", fontSize: 16 }}
            >
              {t("todo.recurrence.off")}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: "8px 16px", fontSize: 16 }}
          >
            {t("todo.recurrence.done")}
          </button>
        </div>
      </div>
    </>
  );
}
