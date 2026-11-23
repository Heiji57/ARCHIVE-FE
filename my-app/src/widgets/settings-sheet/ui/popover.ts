import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";

/** 바깥을 누르면 닫는다. Esc 는 각 컴포넌트의 onKeyDown 이 받아서 시트까지 닫히지 않게 막는다. */
export function useOutside(open: boolean, refs: ReadonlyArray<RefObject<HTMLElement | null>>, close: () => void) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (refs.some((r) => r.current?.contains(t))) return;
      closeRef.current();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, refs]);
}

/** 메뉴 안에서 위아래 화살표로 다음 항목에 초점. */
export function arrowNav(e: ReactKeyboardEvent<HTMLElement>, selector = "button:not(:disabled)") {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>(selector)];
  if (!items.length) return;
  e.preventDefault();
  const i = items.indexOf(document.activeElement as HTMLElement);
  const n =
    e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
  items[n].focus();
}

