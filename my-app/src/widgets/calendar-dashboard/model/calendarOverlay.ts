import { useSyncExternalStore } from "react";
import type { Todo } from "@/entities/todo/model/types";

/**
 * 캘린더 위에 얹는 흐린 칸(Task 10 AI 추천). 넣는 쪽이 id 별로 할 일 모양의 항목을 올리고(null 이면 내림),
 * 캘린더의 CalendarOverlaySlot 이 날짜마다 EventCard ghost 로 그린다. 칸에는 버튼이 없다.
 * todo 는 시간(startTime/endTime)이 있으면 시간 칸에, 없으면 종일 줄(월간은 날짜 칸)에 놓인다.
 */
export interface CalendarOverlayItem {
  key: string;
  todo: Todo;
}

const sources = new Map<string, readonly CalendarOverlayItem[]>();
let snapshot: readonly CalendarOverlayItem[] = [];
const listeners = new Set<() => void>();

function rebuild() {
  snapshot = [...sources.values()].flat();
  for (const l of listeners) l();
}

/** 흐린 칸 묶음을 올리거나(items) 내린다(null). 같은 id 로 다시 부르면 바꾼다. */
export function setCalendarOverlay(id: string, items: readonly CalendarOverlayItem[] | null): void {
  if (items && items.length > 0) sources.set(id, items);
  else if (!sources.delete(id)) return;
  rebuild();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useCalendarOverlayItems(): readonly CalendarOverlayItem[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}
