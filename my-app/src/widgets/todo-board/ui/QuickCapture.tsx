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
    <section
      style={{
        background: "var(--color-tile-1)",
        border: "1px solid var(--color-divider-soft)",
        borderRadius: "var(--r-xl)",
        padding: "28px 32px",
        marginBottom: 28,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 280,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px",
            background: "var(--color-tile-3)",
            borderRadius: "var(--r-pill)",
            border: "1px solid var(--color-divider-soft)",
          }}
        >
          <Sparkles
            size={18}
            style={{ color: "var(--color-primary)", flexShrink: 0 }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("todo.quickCapture.placeholder")}
            style={{ flex: 1, fontSize: 16, minWidth: 0 }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setPickerOpen((p) => !p)}
            className="btn btn-utility"
            style={{ padding: "11px 18px" }}
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
          className="btn btn-primary"
          style={{ padding: "12px 24px" }}
        >
          {t("todo.quickCapture.enter")} <ArrowRight size={14} />
        </button>
      </form>

      <p
        style={{
          margin: "14px 0 0",
          fontSize: 13,
          color: "var(--color-body-muted)",
        }}
      >
        {t("todo.quickCapture.hint")}
      </p>
    </section>
  );
}
