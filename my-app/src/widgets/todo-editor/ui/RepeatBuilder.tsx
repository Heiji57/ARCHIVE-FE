import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  formatRecurrenceRule,
  monthDayLabel,
  monthWeekLabel,
  monthWeekOptions,
  weekdayName,
  weekdayOf,
} from "@/entities/todo/lib/recurrence";
import type { RecurrenceRule, Weekday } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { nextOccurrences } from "../model/dates";
import { MonthCalendar } from "./MonthCalendar";

const UNITS: RecurrenceRule["unit"][] = ["day", "week", "month", "year"];
const WEEK: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** 맞춤 반복(시안 `.z-cx`): 주기, 단위, 요일 또는 몇째 주, 종료, 미리보기와 다음 날짜. */
export function RepeatBuilder({
  dateKey,
  rule,
  recurring,
  today,
  onCancel,
  onApply,
}: {
  dateKey: string;
  rule: RecurrenceRule | null;
  recurring: boolean;
  today: string;
  onCancel: () => void;
  onApply: (rule: RecurrenceRule) => void;
}) {
  const { t, locale } = useTranslation();
  const [cx, setCx] = useState<RecurrenceRule>(() => ({
    unit: "week",
    interval: 1,
    until: null,
    weekdays: null,
    monthWeek: null,
    ...(rule ?? {}),
  }));
  const [pickUntil, setPickUntil] = useState(false);
  const set = (p: Partial<RecurrenceRule>) => setCx((c) => ({ ...c, ...p }));
  const ownDay = weekdayOf(dateKey);
  const days = cx.weekdays?.length ? cx.weekdays : [ownDay];
  const mwOptions = monthWeekOptions(dateKey);
  const mw = cx.monthWeek ?? mwOptions[0];
  const md = (k: string) => monthDayLabel(k, locale);

  return (
    <div className="z-cx" role="group" aria-label={t("todoEditor.cx.title")}>
      <p className="z-cxh">{t("todoEditor.cx.title")}</p>
      <div className="z-cr">
        <span className="z-lb">{t("todoEditor.cx.interval")}</span>
        <span className="z-step">
          <button
            type="button"
            className="z-ib"
            aria-label={t("todoEditor.cx.dec")}
            disabled={cx.interval <= 1}
            onClick={() => set({ interval: Math.max(1, cx.interval - 1) })}
          >
            <Minus size={14} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
          <b aria-live="polite">{cx.interval}</b>
          <button
            type="button"
            className="z-ib"
            aria-label={t("todoEditor.cx.inc")}
            disabled={cx.interval >= 99}
            onClick={() => set({ interval: Math.min(99, cx.interval + 1) })}
          >
            <Plus size={14} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
        </span>
        <span className="z-seg" role="radiogroup" aria-label={t("todoEditor.cx.unit")}>
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={cx.unit === u}
              onClick={() => set({ unit: u, weekdays: u === "week" ? cx.weekdays : null, monthWeek: u === "month" ? mw : null })}
            >
              {t(`todoEditor.cx.unit.${u}`)}
            </button>
          ))}
        </span>
        <span className="z-mu">{t("todoEditor.cx.per")}</span>
      </div>
      {cx.unit === "week" ? (
        <div className="z-cr">
          <span className="z-lb">{t("todoEditor.cx.weekdays")}</span>
          <span className="z-wd" role="group" aria-label={t("todoEditor.cx.weekdaysAria")}>
            {WEEK.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={days.includes(w)}
                aria-label={weekdayName(w, locale, "long")}
                onClick={() => {
                  const next = new Set(days);
                  if (next.has(w)) {
                    if (next.size > 1) next.delete(w);
                  } else next.add(w);
                  set({ weekdays: [...next].sort((a, b) => a - b) });
                }}
              >
                {weekdayName(w, locale, "short")}
              </button>
            ))}
          </span>
        </div>
      ) : null}
      {cx.unit === "month" ? (
        <div className="z-cr">
          <span className="z-lb">{t("todoEditor.cx.monthDay")}</span>
          <span className="z-seg" role="radiogroup" aria-label={t("todoEditor.cx.monthWeekAria")}>
            {mwOptions.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={mw === k} onClick={() => set({ monthWeek: k })}>
                {monthWeekLabel(k, t)} {weekdayName(ownDay, locale, "long")}
              </button>
            ))}
          </span>
        </div>
      ) : null}
      {cx.unit === "year" ? <p className="z-hint">{t("todoEditor.cx.yearHint", { date: md(dateKey) })}</p> : null}
      <div className="z-cr">
        <span className="z-lb">{t("todoEditor.cx.end")}</span>
        <span className="z-seg" role="radiogroup" aria-label={t("todoEditor.cx.end")}>
          <button
            type="button"
            role="radio"
            aria-checked={!cx.until}
            onClick={() => {
              set({ until: null });
              setPickUntil(false);
            }}
          >
            {t("todoEditor.cx.endNone")}
          </button>
          <button type="button" role="radio" aria-checked={Boolean(cx.until)} onClick={() => setPickUntil((v) => !v)}>
            {cx.until ? t("todoEditor.cx.endUntil", { date: md(cx.until) }) : t("todoEditor.cx.endPick")}
          </button>
        </span>
      </div>
      {pickUntil ? (
        <MonthCalendar
          value={cx.until ?? null}
          min={dateKey}
          today={today}
          label={t("todoEditor.cx.endPick")}
          onPick={(d) => {
            set({ until: d });
            setPickUntil(false);
          }}
        />
      ) : null}
      <div className="z-pv">
        <b>{formatRecurrenceRule(cx, dateKey, t, locale)}</b>
        <span>{t("todoEditor.cx.next", { dates: nextOccurrences(cx, dateKey).map(md).join(", ") })}</span>
      </div>
      <div className="z-cf">
        <button type="button" className="z-b" onClick={onCancel}>
          {t("todoEditor.cx.cancel")}
        </button>
        <button type="button" className="z-b p" onClick={() => onApply(cx)}>
          {recurring ? t("todoEditor.cx.applyFollowing") : t("todoEditor.cx.applyConvert")}
        </button>
      </div>
    </div>
  );
}
