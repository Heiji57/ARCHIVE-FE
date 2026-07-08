import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useLatestRef } from "@/shared/lib/useLatestRef";
import type { TurnIntoOption } from "./turnIntoOptions";

export interface HoverState {
  /** top-level block 노드의 시작 position */
  pos: number;
  /** top-level block 노드의 끝 position (pos + nodeSize) */
  endPos: number;
  rect: DOMRect;
  blockEl: HTMLElement;
  isTable: boolean;
}

/**
 * Notion 스타일 블록 핸들 로직 — 호버 추적 + 메뉴 상태 + 블록 액션.
 *
 * NodeSelection 상태에서:
 *  - Del/Backspace → 자동 삭제 (ProseMirror 기본)
 *  - Ctrl+C / Ctrl+V → 자동 복사/붙여넣기
 */
export function useBlockHandle(editor: Editor) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [turnIntoOpen, setTurnIntoOpen] = useState(false);
  // hover/menuOpen 은 이벤트 핸들러·타이머에서만 읽으므로 latest-ref 로 최신값 유지.
  const hoverRef = useLatestRef(hover);
  const menuOpenRef = useLatestRef(menuOpen);

  // debounced hide — 핸들/메뉴/블록 사이의 짧은 갭을 견디게
  const hideTimerRef = useRef<number | null>(null);
  const cancelHide = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  const scheduleHide = (ms = 200) => {
    cancelHide();
    if (menuOpenRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      setHover(null);
      hideTimerRef.current = null;
    }, ms);
  };

  useEffect(() => {
    const editorDom = editor.view.dom;
    if (!editorDom) return;

    const findTopLevelBlock = (el: HTMLElement): HTMLElement | null => {
      let cur: HTMLElement | null = el;
      while (cur && cur.parentElement !== editorDom) {
        cur = cur.parentElement;
      }
      return cur;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (menuOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".rich-block-handle, .rich-block-menu")) {
        cancelHide();
        return;
      }
      // 표 사이드 핸들 영역은 무시 (TableControls가 처리)
      if (target.closest(".rich-table-handle")) return;
      if (!editorDom.contains(target)) {
        scheduleHide();
        return;
      }
      const block = findTopLevelBlock(target);
      if (!block) {
        scheduleHide();
        return;
      }
      cancelHide();
      const rect = block.getBoundingClientRect();
      const rawPos = editor.view.posAtDOM(block, 0);
      if (rawPos < 0) {
        setHover(null);
        return;
      }
      // top-level block의 정확한 시작 pos와 nodeSize 계산
      let blockPos = rawPos;
      let blockSize = 0;
      try {
        const $pos = editor.state.doc.resolve(rawPos);
        if ($pos.depth >= 1) {
          blockPos = $pos.before(1);
          blockSize = $pos.node(1).nodeSize;
        } else {
          const node = editor.state.doc.nodeAt(rawPos);
          blockSize = node?.nodeSize ?? 0;
        }
      } catch {
        return;
      }
      if (blockSize === 0) {
        setHover(null);
        return;
      }
      const endPos = blockPos + blockSize;
      const isTable = block.tagName === "TABLE";
      const prev = hoverRef.current;
      if (
        prev &&
        prev.blockEl === block &&
        prev.rect.top === rect.top &&
        prev.rect.left === rect.left
      ) {
        return;
      }
      setHover({ pos: blockPos, endPos, rect, blockEl: block, isTable });
    };

    const onScrollOrResize = () => {
      const h = hoverRef.current;
      if (!h) return;
      setHover({ ...h, rect: h.blockEl.getBoundingClientRect() });
    };

    const onContainerLeave = (e: MouseEvent) => {
      if (menuOpenRef.current) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest?.(".rich-block-handle, .rich-block-menu")) {
        cancelHide();
        return;
      }
      scheduleHide();
    };

    editorDom.addEventListener("mousemove", onMouseMove);
    editorDom.addEventListener("mouseleave", onContainerLeave);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      editorDom.removeEventListener("mousemove", onMouseMove);
      editorDom.removeEventListener("mouseleave", onContainerLeave);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [editor]);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest(".rich-block-menu, .rich-block-handle")) return;
      setMenuOpen(false);
      setTurnIntoOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const openMenu = () => {
    if (!hover) return;
    // 블록을 NodeSelection으로 선택 → Del/Ctrl+C/Ctrl+V 자동 동작
    try {
      editor.chain().focus().setNodeSelection(hover.pos).run();
    } catch {
      /* noop */
    }
    setMenuOpen((v) => !v);
    setTurnIntoOpen(false);
  };

  const insertAfter = () => {
    if (!hover) return;
    try {
      editor
        .chain()
        .focus()
        .insertContentAt(hover.endPos, { type: "paragraph" })
        .setTextSelection(hover.endPos + 1)
        .run();
    } catch {
      editor.chain().focus().createParagraphNear().run();
    }
    setMenuOpen(false);
  };

  const deleteBlock = () => {
    if (!hover) return;
    try {
      editor
        .chain()
        .focus()
        .deleteRange({ from: hover.pos, to: hover.endPos })
        .run();
    } catch {
      /* noop */
    }
    setMenuOpen(false);
    setHover(null);
  };

  const duplicateBlock = () => {
    if (!hover) return;
    try {
      const blockNode = editor.state.doc.nodeAt(hover.pos);
      if (!blockNode) return;
      const json = blockNode.toJSON();
      editor.chain().focus().insertContentAt(hover.endPos, json).run();
    } catch {
      /* noop */
    }
    setMenuOpen(false);
  };

  const turnInto = (option: TurnIntoOption) => {
    if (!hover) return;
    try {
      option.apply(editor, hover.pos);
    } catch {
      /* noop */
    }
    setMenuOpen(false);
    setTurnIntoOpen(false);
  };

  return {
    hover,
    menuOpen,
    turnIntoOpen,
    setTurnIntoOpen,
    cancelHide,
    scheduleHide,
    openMenu,
    insertAfter,
    deleteBlock,
    duplicateBlock,
    turnInto,
  };
}
