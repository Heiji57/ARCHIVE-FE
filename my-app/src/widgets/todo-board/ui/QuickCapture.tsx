import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronDown, Sparkles } from "lucide-react";
import { addDays, toDateKey, todayKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";
import { DatePickerPopover } from "./DatePickerPopover";

export interface QuickCaptureProps {
  onSubmit: (text: string, dateKey: string) => void;
}

/**
 * Top "Quick Capture" form on the Todo board. Text field +
 * date chip + Enter button.
 */
export function QuickCapture({ onSubmit }: QuickCaptureProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState(todayKey);

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
    onSubmit(input.trim(), pickedDate);
    setInput("");
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

      <p className="quick-capture-hint">
        {t("todo.quickCapture.hint")}
      </p>
    </section>
  );
}
