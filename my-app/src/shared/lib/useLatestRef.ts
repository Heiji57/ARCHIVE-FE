import { useEffect, useRef } from "react";

/**
 * 항상 최신 값을 담은 ref (latest-value 패턴).
 *
 * 렌더 중 `ref.current = value` 로 쓰던 관용구를 대체한다 — 렌더 중 ref 쓰기는
 * React Compiler 규칙 위반이라 커밋 이후 effect 에서 갱신한다. 반환 ref 는
 * **이벤트 핸들러·타이머 등 커밋 이후 비동기 컨텍스트에서만 읽어야** 동작이
 * 동일하다(렌더 중 읽으면 직전 값이 보인다).
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
