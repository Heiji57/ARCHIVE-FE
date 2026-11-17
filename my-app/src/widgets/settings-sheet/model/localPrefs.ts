import { useCallback, useSyncExternalStore } from "react";
import type { WeekStart } from "./workHours";

/**
 * 서버(api.yaml)에 아직 없는 설정 값. 실제 모드에서는 이 줄들이 숨겨지고(useServerFeature),
 * 데모에서는 화면 안 상태로만 바뀐다(새로 고치면 처음 값). 서버가 생기면 settings API 로 옮긴다.
 */
export interface LocalPrefs {
  startTab: "ai" | "calendar" | "todos" | "retro";
  timeFmt: "12" | "24";
  weekStart: WeekStart;
  days: number[];
  wFrom: string;
  wTo: string;
  /** 기본 할 일 길이(분) */
  dur: number;
  done: "keep" | "dim" | "hide";
  dayEnd: boolean;
  dayEndAt: string;
  folder: string;
  tools: { cal: boolean; todo: boolean; retro: boolean; gh: boolean };
  confirm: "always" | "small";
  deep: "on" | "off";
  len: "quick" | "deep";
  /** null 이면 데모 기본 메모(문구 키) */
  memo: string | null;
  sched: boolean[];
  aiKeep: "30" | "90" | "ever";
  noti: { due: boolean; sum: boolean; sched: boolean; link: boolean };
  browser: "ask" | "on";
  dnd: boolean;
  dndFrom: string;
  dndTo: string;
  mail: boolean;
}

/** 시안 V 의 처음 값. 주 시작 기본은 이슈 기록 "계획 단계"의 결정(일요일)을 따른다. */
export const DEFAULT_LOCAL_PREFS: LocalPrefs = {
  startTab: "calendar",
  timeFmt: "12",
  weekStart: "sun",
  days: [1, 2, 3, 4, 5],
  wFrom: "09:00",
  wTo: "18:00",
  dur: 60,
  done: "dim",
  dayEnd: true,
  dayEndAt: "21:00",
  folder: "",
  tools: { cal: true, todo: true, retro: true, gh: true },
  confirm: "always",
  deep: "on",
  len: "quick",
  memo: null,
  sched: [true, false],
  aiKeep: "90",
  noti: { due: true, sum: true, sched: true, link: true },
  browser: "ask",
  dnd: true,
  dndFrom: "22:00",
  dndTo: "08:00",
  mail: false,
};

let prefs: LocalPrefs = DEFAULT_LOCAL_PREFS;
const subs = new Set<() => void>();

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function setLocalPrefs(patch: Partial<LocalPrefs>) {
  prefs = { ...prefs, ...patch };
  subs.forEach((f) => f());
}

export function useLocalPrefs(): [LocalPrefs, (patch: Partial<LocalPrefs>) => void] {
  const v = useSyncExternalStore(subscribe, () => prefs, () => prefs);
  const set = useCallback((p: Partial<LocalPrefs>) => setLocalPrefs(p), []);
  return [v, set];
}
