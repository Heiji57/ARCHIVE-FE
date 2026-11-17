import { isOnDay } from "../model/eventInfo";
import { useCalendarOverlayItems } from "../model/calendarOverlay";
import { placeDay, timesOf } from "../model/grid";
import { EventCard } from "./EventCard";

/**
 * 흐린 칸 자리(Task 10). setCalendarOverlay 로 올린 항목 중 그 날 것을 EventCard ghost 로 그린다.
 * - week: 하루 시간 칸 안(시간 있는 항목)
 * - month: 월간 날짜 칸 안(전부)
 * - allday: 주간 종일 줄의 한 칸(시간 없는 항목), column 은 그 날의 격자 열(1부터)
 */
export function CalendarOverlaySlot({
  dateKey,
  variant,
  column,
}: {
  dateKey: string;
  variant: "week" | "month" | "allday";
  column?: number;
}) {
  const items = useCalendarOverlayItems();
  const mine = items.filter((x) => isOnDay(x.todo, dateKey));
  if (mine.length === 0) return null;
  if (variant === "week") {
    const placed = placeDay(mine.filter((x) => timesOf(x.todo)).map((x) => x.todo));
    return (
      <>
        {placed.map((p) => (
          <EventCard
            key={`ov-${p.todo.id}`}
            todo={p.todo}
            variant="week"
            ghost
            layout={{ top: p.top, height: p.height }}
          />
        ))}
      </>
    );
  }
  if (variant === "allday") {
    return (
      <>
        {mine
          .filter((x) => !timesOf(x.todo))
          .map((x) => (
            <EventCard key={`ov-${x.key}`} todo={x.todo} variant="allday" ghost style={{ gridColumn: column }} />
          ))}
      </>
    );
  }
  return (
    <>
      {mine.map((x) => (
        <EventCard key={`ov-${x.key}`} todo={x.todo} variant="month" ghost />
      ))}
    </>
  );
}
