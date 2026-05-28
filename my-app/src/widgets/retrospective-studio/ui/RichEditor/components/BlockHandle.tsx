import { useEffect, useRef, useState } from "react";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

/**
 * Notion 스타일 블록 핸들.
 *
 * 마우스 호버 시 해당 블록 좌측에:
 *   ⊕  — 클릭: 그 블록 다음에 새 빈 단락 추가
 *   ⋮⋮ — 클릭: 작은 메뉴 (블록 삭제 / 복제 / 위·아래)
 *
 * 표(table)는 별도 TableControls에서 처리하므로 핸들 제외.
 */
export function BlockHandle({ editor }: { editor: Editor }) {
  const [hover, setHover] = useState<{
    pos: number;
    rect: DOMRect;
    blockEl: HTMLElement;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const hoverRef = useRef(hover);
  hoverRef.current = hover;
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;

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
      // 메뉴 떠 있을 땐 호버 추적 중단
      if (menuOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // 핸들 위에 있으면 그대로 유지
      if (target.closest(".rich-block-handle")) return;
      // 표는 TableControls가 처리
      if (target.closest("table")) {
        setHover(null);
        return;
      }
      if (!editorDom.contains(target)) {
        setHover(null);
        return;
      }
      const block = findTopLevelBlock(target);
      if (!block) {
        setHover(null);
        return;
      }
      const rect = block.getBoundingClientRect();
      const pos = editor.view.posAtDOM(block, 0);
      if (pos < 0) {
        setHover(null);
        return;
      }
      // 같은 블록이면 갱신만 안 함 (rerender 줄이기)
      const prev = hoverRef.current;
      if (
        prev &&
        prev.blockEl === block &&
        prev.rect.top === rect.top &&
        prev.rect.left === rect.left
      ) {
        return;
      }
      setHover({ pos, rect, blockEl: block });
    };

    const onScrollOrResize = () => {
      const h = hoverRef.current;
      if (!h) return;
      setHover({ ...h, rect: h.blockEl.getBoundingClientRect() });
    };

    // 호버 밖으로 나가도 메뉴 떠 있으면 유지
    const onContainerLeave = (e: MouseEvent) => {
      if (menuOpenRef.current) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest?.(".rich-block-handle")) return;
      setHover(null);
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
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  if (!hover) return null;

  const insertAfter = () => {
    // 그 블록의 끝 다음에 새 빈 단락 삽입
    try {
      const $pos = editor.state.doc.resolve(hover.pos);
      const blockNode = $pos.nodeAfter ?? editor.state.doc.nodeAt(hover.pos);
      if (!blockNode) return;
      const endPos = hover.pos + blockNode.nodeSize;
      editor
        .chain()
        .focus()
        .insertContentAt(endPos, { type: "paragraph" })
        .setTextSelection(endPos + 1)
        .run();
    } catch {
      // 폴백
      editor.chain().focus().createParagraphNear().run();
    }
    setMenuOpen(false);
  };

  const deleteBlock = () => {
    try {
      const blockNode = editor.state.doc.nodeAt(hover.pos);
      if (!blockNode) return;
      const endPos = hover.pos + blockNode.nodeSize;
      editor.chain().focus().deleteRange({ from: hover.pos, to: endPos }).run();
    } catch {
      /* noop */
    }
    setMenuOpen(false);
    setHover(null);
  };

  const duplicateBlock = () => {
    try {
      const blockNode = editor.state.doc.nodeAt(hover.pos);
      if (!blockNode) return;
      const endPos = hover.pos + blockNode.nodeSize;
      const json = blockNode.toJSON();
      editor.chain().focus().insertContentAt(endPos, json).run();
    } catch {
      /* noop */
    }
    setMenuOpen(false);
  };

  const handleSize = 22;
  const left = hover.rect.left - 56;
  const top = hover.rect.top + 4;

  return (
    <>
      {/* + 아이콘 — 클릭하면 이 블록 다음에 새 빈 단락 */}
      <button
        type="button"
        className="rich-block-handle rich-block-handle-add"
        style={{
          position: "fixed",
          left,
          top,
          width: handleSize,
          height: handleSize,
        }}
        onClick={insertAfter}
        title="아래에 블록 추가"
      >
        <Plus size={14} />
      </button>

      {/* ⋮⋮ 아이콘 — 클릭하면 메뉴 열림 */}
      <button
        type="button"
        className="rich-block-handle rich-block-handle-menu"
        style={{
          position: "fixed",
          left: left + handleSize + 2,
          top,
          width: handleSize,
          height: handleSize,
        }}
        onClick={() => setMenuOpen((v) => !v)}
        title="블록 메뉴"
      >
        <GripVertical size={14} />
      </button>

      {menuOpen ? (
        <div
          className="rich-block-menu"
          style={{
            position: "fixed",
            left: left + handleSize * 2 + 6,
            top,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="rich-block-menu-item"
            onClick={duplicateBlock}
          >
            <Copy size={13} />
            <span>복제</span>
          </button>
          <button
            type="button"
            className="rich-block-menu-item rich-block-menu-item-danger"
            onClick={deleteBlock}
          >
            <Trash2 size={13} />
            <span>삭제</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
