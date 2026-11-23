import { useSyncExternalStore } from "react";

/** 위젯 안에서만 쓰는 아주 작은 공유 상태(새로 고치면 처음 값). */
export function createStore<T>(initial: T) {
  let value = initial;
  const subs = new Set<() => void>();
  const subscribe = (cb: () => void) => {
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  };
  return {
    get: () => value,
    set(next: T | ((cur: T) => T)) {
      value = typeof next === "function" ? (next as (cur: T) => T)(value) : next;
      subs.forEach((f) => f());
    },
    use(): T {
      return useSyncExternalStore(subscribe, () => value, () => value);
    },
  };
}
