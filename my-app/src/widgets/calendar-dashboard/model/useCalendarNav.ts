import { useState } from "react";
import { addDays } from "@/shared/lib/date";

export type CalendarView = "day" | "week" | "month";

/**
 * Encapsulates the calendar's view-mode + cursor state and the
 * direction navigation (prev/today/next).
 *
 * @param anchorDate 초기 cursor 와 "오늘로 이동" 기준 날짜.
 *   실제 사용자는 오늘, 데모 모드는 시드 앵커 날짜를 전달한다.
 */
export function useCalendarNav(anchorDate: Date) {
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState(anchorDate);

  const navigate = (dir: -1 | 1) => {
    if (view === "day") {
      setCursor((prev) => addDays(prev, dir));
    } else if (view === "week") {
      setCursor((prev) => addDays(prev, dir * 7));
    } else {
      setCursor(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 15, 12),
      );
    }
  };

  const goToday = () => setCursor(anchorDate);

  return { view, setView, cursor, setCursor, navigate, goToday };
}
