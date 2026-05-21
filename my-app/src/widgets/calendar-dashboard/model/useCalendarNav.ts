import { useState } from "react";
import { DEMO_ANCHOR_DATE } from "@/app/config/demo";
import { addDays } from "@/shared/lib/date";

export type CalendarView = "week" | "month";

/**
 * Encapsulates the calendar's view-mode + cursor state and the
 * direction navigation (prev/today/next).
 */
export function useCalendarNav() {
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState(DEMO_ANCHOR_DATE);

  const navigate = (dir: -1 | 1) => {
    if (view === "week") {
      setCursor((prev) => addDays(prev, dir * 7));
    } else {
      setCursor(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 15, 12),
      );
    }
  };

  const goToday = () => setCursor(DEMO_ANCHOR_DATE);

  return { view, setView, cursor, setCursor, navigate, goToday };
}
