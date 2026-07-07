import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronDown, Sparkles } from "lucide-react";
import { addDays, toDateKey, todayKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { DatePickerPopover } from "./DatePickerPopover";

export interface QuickCaptureProps {
  onSubmit: (text: string, dateKey: string, pushToCalendar: boolean | null) => void;
  /** 캘린더가 연결된 상태일 때만 체크박스를 표시한다. */
  calendarConnected?: boolean;
  /** 초기 체크 상태 (사용자가 명시적으로 바꾸기 전까지만 사용). */
  calendarAutoPushTodo?: boolean;
}

/**
 * Top "Quick Capture" form on the Todo board. Text field +
 * date chip + Enter button.
 */
export function QuickCapture({ onSubmit, calendarConnected, calendarAutoPushTodo }: QuickCaptureProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState(todayKey);
  // null = 사용자가 명시적으로 바꾸지 않음 → 서버에 null 전송
  const [pushToCalendar, setPushToCalendar] = useState<boolean | null>(null);

  const today = new Date();
  const todayK = toDateKey(today);
  const tomorrowK = toDateKey(addDays(today, 1));

  const pickedLabel =
    pickedDate === todayK
      ? t("todo.quick.today")
      : pickedDate === tomorrowK
        ? t("todo.quick.tomorrow")
        : pickedDate;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSubmit(input.trim(), pickedDate, pushToCalendar);
    setInput("");
    setPushToCalendar(null);
  };

  return (
    <section className="quick-capture">
      <form onSubmit={submit} className="quick-capture-form">
        <div className="quick-capture-input-wrap">
          <Sparkles size={18} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("todo.quickCapture.placeholder")}
            className="quick-capture-input"
          />
        </div>

        <div className="quick-capture-date-wrap">
          <button
            type="button"
            onClick={() => setPickerOpen((p) => !p)}
            className="btn btn-utility quick-capture-date-btn"
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

        <button
          type="submit"
          className="btn btn-primary quick-capture-submit"
        >
          {t("todo.quickCapture.enter")} <ArrowRight size={14} />
        </button>
      </form>

      {calendarConnected ? (
        <label className="quick-capture-calendar-check">
          <input
            type="checkbox"
            checked={pushToCalendar ?? calendarAutoPushTodo ?? false}
            onChange={(e) => setPushToCalendar(e.target.checked)}
          />
          {t("todo.create.pushToCalendar")}
        </label>
      ) : null}

      <p className="quick-capture-hint">
        {t("todo.quickCapture.hint")}
      </p>
    </section>
  );
}
