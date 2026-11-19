import { useSyncExternalStore } from "react";

/**
 * 하루 닫기 창 열림 상태. 사이드바 오늘 회고 "쓰기", 오른쪽 줄 "오늘 마무리", 팔레트 "하루 닫기"가 연다.
 * date 가 null 이면 화면이 고른 날짜(CloseDayHost 의 dateKey).
 */
export interface CloseDayState {
  open: boolean;
  date: string | null;
}

let state: CloseDayState = { open: false, date: null };
const listeners = new Set<() => void>();
const set = (next: CloseDayState) => {
  state = next;
  for (const l of listeners) l();
};

export const closeDayActions = {
  open(date: string | null = null) {
    set({ open: true, date });
  },
  close() {
    set({ open: false, date: null });
  },
};

export function useCloseDayState(): CloseDayState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => state,
    () => state,
  );
}
