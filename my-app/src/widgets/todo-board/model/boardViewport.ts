import { useSyncExternalStore } from "react";

/** 보드가 보이는 범위를 도구 막대에 알린다(제목의 달, 오늘이 어느 쪽에 있는지). */
export interface BoardViewport {
  anchor: string | null;
  todayDir: "in" | "left" | "right";
}

let vp: BoardViewport = { anchor: null, todayDir: "in" };
const listeners = new Set<() => void>();

export function setBoardViewport(next: BoardViewport): void {
  if (next.anchor === vp.anchor && next.todayDir === vp.todayDir) return;
  vp = next;
  for (const l of listeners) l();
}

export function useBoardViewport(): BoardViewport {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => vp,
    () => vp,
  );
}
