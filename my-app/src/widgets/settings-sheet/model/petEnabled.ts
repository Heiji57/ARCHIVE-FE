import { useCallback, useSyncExternalStore } from "react";

/** 빗금이 보이기(설정 AI 비서 맨 위). 데모와 실제 모두 이 브라우저에만 저장한다. */
export const PET_ENABLED_KEY = "archive.petEnabled";
const EVENT = "archive:petEnabled";

type ReadStore = Pick<Storage, "getItem">;
type WriteStore = Pick<Storage, "setItem">;

function defaultStore(): (ReadStore & WriteStore) | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readPetEnabled(store: ReadStore | null = defaultStore()): boolean {
  try {
    const v = store?.getItem(PET_ENABLED_KEY);
    return !(v === "false" || v === "0");
  } catch {
    return true;
  }
}

export function writePetEnabled(on: boolean, store: WriteStore | null = defaultStore()): void {
  try {
    store?.setItem(PET_ENABLED_KEY, on ? "true" : "false");
  } catch {
    /* 저장 못 해도 이번 화면에서는 바뀐 값으로 보인다 */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

let memo: boolean | null = null;

function subscribe(cb: () => void) {
  const on = (e: Event) => {
    if (e instanceof StorageEvent && e.key !== PET_ENABLED_KEY) return;
    memo = null;
    cb();
  };
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", on);
  };
}

function snapshot(): boolean {
  if (memo === null) memo = readPetEnabled();
  return memo;
}

/**
 * 빗금이 켜짐 여부와 바꾸는 함수. Task 9(빗금이)가 읽는다.
 * localStorage `archive.petEnabled`, 기본 true. 다른 탭에서 바꿔도 따라간다.
 */
export function usePetEnabled(): [boolean, (v: boolean) => void] {
  const on = useSyncExternalStore(subscribe, snapshot, () => true);
  const set = useCallback((v: boolean) => {
    memo = v;
    writePetEnabled(v);
  }, []);
  return [on, set];
}
