import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { SummaryKind } from "@/entities/summary/model/types";
import { formatMonthLabel } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { buildPeriodOptions, isoWeekOf, type PeriodOption } from "../model/periods";

export interface PeriodPickerModalProps {
  /** 열린 요약 종류. (부모가 key 로 조건부 마운트하므로 항상 non-null) */
  kind: SummaryKind;
  /** 기준 "오늘" Date (타임존 반영된 dateKey 로부터). */
  today: Date;
  /** 기간 확정 — periodStart/periodEnd(dateKey) 와 anchorDateKey(=periodEnd) 전달. */
  onPick: (periodStart: string, periodEnd: string, anchorDateKey: string) => void;
  onCancel: () => void;
}

const TITLE_KEY = {
  weekly: "retro.period.weeklyTitle",
  monthly: "retro.period.monthlyTitle",
  yearly: "retro.period.yearlyTitle",
} as const;

/**
 * 요약할 기간(주/월/년)을 선택하는 모달.
 * 부모는 `key={kind}` 로 조건부 마운트해 종류 전환 시 상태가 초기화되게 한다.
 */
export function PeriodPickerModal({
  kind,
  today,
  onPick,
  onCancel,
}: PeriodPickerModalProps) {
  const { t, locale } = useTranslation();
  const [selected, setSelected] = useState(0);

  const options = useMemo<PeriodOption[]>(
    () => buildPeriodOptions(kind, today),
    [kind, today],
  );

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

  const labelFor = (opt: PeriodOption): string => {
    switch (kind) {
      case "weekly":
        return t("retro.period.weekLabel", {
          year: opt.startDate.getFullYear(),
          week: isoWeekOf(opt.startDate),
        });
      case "monthly":
        return formatMonthLabel(opt.startDate, locale);
      case "yearly":
        return `${opt.startDate.getFullYear()}`;
    }
  };

  const rangeFor = (opt: PeriodOption): string =>
    `${opt.periodStart} ~ ${opt.periodEnd}`;

  const confirm = () => {
    const opt = options[selected];
    if (!opt) return;
    onPick(opt.periodStart, opt.periodEnd, opt.periodEnd);
  };

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
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--color-tile-1)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-xl)",
          padding: "24px 22px 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <h3
          style={{
            margin: "0 0 6px",
            fontFamily: "var(--font-display)",
            fontSize: 19,
            fontWeight: 600,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {t(TITLE_KEY[kind])}
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 16,
            lineHeight: 1.5,
            color: "var(--color-body-muted)",
          }}
        >
          {t("retro.period.description")}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 320,
            overflow: "auto",
            marginBottom: 20,
          }}
        >
          {options.map((opt, i) => {
            const isActive = i === selected;
            return (
              <button
                key={opt.periodStart}
                type="button"
                onClick={() => setSelected(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "10px 14px",
                  textAlign: "left",
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${
                    isActive
                      ? "var(--color-primary)"
                      : "var(--color-divider-soft)"
                  }`,
                  background: isActive
                    ? "var(--color-tile-3)"
                    : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--color-ink)",
                    }}
                  >
                    {labelFor(opt)}
                    {i === 0 ? (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "var(--r-pill)",
                          background: "var(--color-primary)",
                          color: "#fff",
                        }}
                      >
                        {t("retro.period.currentBadge")}
                      </span>
                    ) : null}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 12,
                      color: "var(--color-body-muted)",
                    }}
                  >
                    {rangeFor(opt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-utility"
            onClick={onCancel}
            style={{ padding: "9px 16px" }}
          >
            {t("retro.period.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={confirm}
            style={{ padding: "9px 18px" }}
          >
            {t("retro.period.confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
