import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { filterCommands } from "./commands";
import { detectSlashQuery } from "./extensions";
import {
  EMPTY_POPUP,
  type PopupState,
  type SlashCommandItem,
  type SlashMenuRef,
} from "./types";

/**
 * 슬래시(`/`) 메뉴 상태 관리.
 *  - transaction/selectionUpdate에서 `/<query>` 감지 → 팝업 위치/쿼리 갱신
 *  - 팝업 열림 시 ↑↓/Enter/Esc/Space 키보드 가로채기 (document 레벨)
 *  - 항목 선택 시 명령 실행
 */
export function useSlashPopup(editor: Editor | null) {
  const [popup, setPopup] = useState<PopupState>(EMPTY_POPUP);
  const menuRef = useRef<SlashMenuRef | null>(null);

  // 슬래시 쿼리 감지 — transaction/selectionUpdate에서 popup 갱신
  useEffect(() => {
    if (!editor) return;

    const updatePopup = () => {
      const result = detectSlashQuery(editor);
      if (!result.active) {
        setPopup((prev) => (prev.open ? EMPTY_POPUP : prev));
        return;
      }
      const coords = editor.view.coordsAtPos(result.from);
      setPopup((prev) => {
        // 같은 슬래시 시작 위치면 rect 유지 + query/to만 갱신
        // → SlashMenuPortal의 위치 재계산 useEffect가 안 돌아 깜빡임 제거
        if (
          prev.open &&
          prev.from === result.from &&
          prev.rect &&
          prev.rect.left === coords.left &&
          prev.rect.top === coords.top
        ) {
          if (prev.query === result.query && prev.to === result.to) {
            return prev;
          }
          return { ...prev, query: result.query, to: result.to };
        }
        return {
          open: true,
          rect: new DOMRect(
            coords.left,
            coords.top,
            0,
            coords.bottom - coords.top,
          ),
          query: result.query,
          from: result.from,
          to: result.to,
        };
      });
    };

    editor.on("transaction", updatePopup);
    editor.on("selectionUpdate", updatePopup);
    return () => {
      editor.off("transaction", updatePopup);
      editor.off("selectionUpdate", updatePopup);
    };
  }, [editor]);

  // popup이 열려있을 때만 키보드 가로채기 (document 레벨)
  useEffect(() => {
    if (!popup.open) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // 에디터 영역 안에서만 가로채기
      if (!target?.closest(".rich-editor")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setPopup(EMPTY_POPUP);
        return;
      }
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter"
      ) {
        if (menuRef.current?.onKeyDown({ event })) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      // spacebar — 메뉴 열려있으면 첫 항목(또는 선택된 항목) 실행 후 닫기
      if (event.key === " " || event.code === "Space") {
        const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
        if (menuRef.current?.onKeyDown({ event: enterEvent })) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [popup.open]);

  const handleSelect = (item: SlashCommandItem) => {
    if (!editor) return;
    item.execute(editor, { from: popup.from, to: popup.to });
    setPopup(EMPTY_POPUP);
    editor.commands.focus();
  };

  const items = filterCommands(popup.query);

  return { popup, menuRef, items, handleSelect };
}
