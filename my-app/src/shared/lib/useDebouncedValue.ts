import { useEffect, useState } from "react";

/** 값이 delayMs 동안 안 바뀌면 그 값을 반환한다(입력마다 API 호출 방지). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
