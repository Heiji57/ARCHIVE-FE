import { useEffect, useSyncExternalStore } from "react";
import { useTodayKey } from "@/app/providers/useToday";

/**
 * 오른쪽 패널이 보여 줄 날짜. 캘린더와 할 일 화면이 고른 날짜를 알린다(usePanelDateSync).
 * 탭은 셸에 등록돼 페이지 밖에서 그려지므로 모듈 저장소로 건넨다(AppProvider 밖).
 */
let current: string | null = null;
const listeners = new Set<() => void>();

function set(d: string | null) {
  if (d === current) return;
  current = d;
  for (const l of listeners) l();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** 페이지가 고른 날짜를 패널에 알린다. 페이지가 사라지면 오늘로 돌아간다. */
export function usePanelDateSync(dateKey: string): void {
  useEffect(() => {
    set(dateKey);
  }, [dateKey]);
  useEffect(() => () => set(null), []);
}

/** 패널 날짜(알린 날짜가 없으면 오늘). */
export function usePanelDate(): string {
  const today = useTodayKey();
  const d = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
  return d ?? today;
}
