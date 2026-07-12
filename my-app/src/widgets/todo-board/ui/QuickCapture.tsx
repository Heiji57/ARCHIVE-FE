import { useState } from "react";
import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import { DatePickerPopover } from "@/entities/todo/ui/DatePickerPopover";
import { addDays, toDateKey, todayKey } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";

export interface QuickCaptureProps {
  onSubmit: (text: string, dateKey: string) => void;
}

/**
 * Compact single-row capture bar at the bottom of the Todo board:
 * text field + date chip + Add button.
 *
 * 새 할 일의 Google Calendar push 여부는 `calendarAutoPushTodo` 설정을
 * 그대로 따른다(생성 시 별도 토글 없음 → 서버가 설정값으로 처리).
 * 개별 할 일의 캘린더 연동 변경은 상세 패널에서 한다.
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
    <form onSubmit={submit} className="quick-capture">
      <div className="quick-capture-input-wrap">
        <Plus size={16} />
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

      <button type="submit" className="btn btn-primary quick-capture-submit">
        {t("todo.quickCapture.add")}
      </button>
    </form>
  );
}
