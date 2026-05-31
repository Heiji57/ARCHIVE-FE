import { useEffect, useRef, useState } from "react";
import type { SlashCommandItem, SlashMenuRef } from "../model/types";
import { SlashMenu } from "./slash-menu/SlashMenu";

/**
 * 슬래시 메뉴를 fixed 위치로 띄우는 포털 래퍼.
 *  - 화면 경계를 넘으면 위/왼쪽으로 뒤집어 배치.
 */
export function SlashMenuPortal({
  rect,
  items,
  onSelect,
  menuRef,
}: {
  rect: DOMRect;
  items: SlashCommandItem[];
  onSelect: (item: SlashCommandItem) => void;
  menuRef: React.MutableRefObject<SlashMenuRef | null>;
}) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ top: rect.bottom + 8, left: rect.left });

  // rect 의존성 — 좌표값만 안정화하여 동일 위치면 effect skip
  const rectLeft = rect.left;
  const rectTop = rect.top;
  const rectBottom = rect.bottom;

  useEffect(() => {
    if (!popupRef.current) return;
    const popupRect = popupRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = rectBottom + 8;
    let left = rectLeft;
    if (top + popupRect.height > vh) {
      top = Math.max(8, rectTop - popupRect.height - 8);
    }
    if (left + popupRect.width > vw) {
      left = Math.max(8, vw - popupRect.width - 8);
    }
    setPos((prev) =>
      prev.top === top && prev.left === left ? prev : { top, left },
    );
  }, [rectLeft, rectTop, rectBottom]);

  return (
    <div
      ref={popupRef}
      className="slash-menu-popup"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
      }}
    >
      <SlashMenu ref={menuRef} items={items} command={onSelect} />
    </div>
  );
}
