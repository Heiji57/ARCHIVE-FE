import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

/**
 * 표 호버 시 우측/하단에 + 버튼, 좌상단에 삭제 버튼을 띄움.
 * + 클릭 시 숫자 입력 팝업 → Enter로 행/열 추가.
 */
export function TableControls({ editor }: { editor: Editor }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLTableElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [popover, setPopover] = useState<null | "col" | "row">(null);
  const [count, setCount] = useState<string>("1");

  useEffect(() => {
    const container = editor.view.dom;
    if (!container) return;

    const updateForElement = (el: HTMLTableElement | null) => {
      if (!el) {
        setTarget(null);
        setRect(null);
        return;
      }
      setTarget(el);
      setRect(el.getBoundingClientRect());
    };

    const onMouseOver = (e: MouseEvent) => {
      const table = (e.target as HTMLElement | null)?.closest(
        "table",
      ) as HTMLTableElement | null;
      if (table) updateForElement(table);
    };

    const onScrollOrResize = () => {
      if (target) setRect(target.getBoundingClientRect());
    };

    const onMouseLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as Node | null;
      if (related && wrapperRef.current?.contains(related)) return;
      if (related && target?.contains(related)) return;
      // 팝오버가 열려있으면 유지
      if (popover) return;
      setTarget(null);
      setRect(null);
    };

    container.addEventListener("mouseover", onMouseOver);
    container.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      container.removeEventListener("mouseover", onMouseOver);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [editor, target, popover]);

  if (!target || !rect) return null;

  const handleAddCol = () => {
    const n = Math.max(1, Math.min(20, parseInt(count, 10) || 1));
    // 표 안 첫 셀로 포커스 이동 후 마지막 열 추가
    for (let i = 0; i < n; i += 1) editor.chain().focus().addColumnAfter().run();
    setPopover(null);
    setCount("1");
  };

  const handleAddRow = () => {
    const n = Math.max(1, Math.min(50, parseInt(count, 10) || 1));
    for (let i = 0; i < n; i += 1) editor.chain().focus().addRowAfter().run();
    setPopover(null);
    setCount("1");
  };

  const handleDelete = () => {
    editor.chain().focus().deleteTable().run();
    setTarget(null);
    setRect(null);
  };

  return (
    <div ref={wrapperRef} className="rich-table-controls" aria-hidden="false">
      {/* 우측 + 버튼 (열 추가) */}
      <button
        type="button"
        className="rich-table-btn rich-table-btn-col"
        style={{
          position: "fixed",
          left: rect.right + 4,
          top: rect.top + rect.height / 2 - 12,
        }}
        onClick={() => {
          setPopover("col");
          setCount("1");
        }}
        title="열 추가"
      >
        <Plus size={12} />
      </button>

      {/* 하단 + 버튼 (행 추가) */}
      <button
        type="button"
        className="rich-table-btn rich-table-btn-row"
        style={{
          position: "fixed",
          left: rect.left + rect.width / 2 - 12,
          top: rect.bottom + 4,
        }}
        onClick={() => {
          setPopover("row");
          setCount("1");
        }}
        title="행 추가"
      >
        <Plus size={12} />
      </button>

      {/* 좌상단 삭제 버튼 */}
      <button
        type="button"
        className="rich-table-btn rich-table-btn-delete"
        style={{
          position: "fixed",
          left: rect.left - 24,
          top: rect.top - 4,
        }}
        onClick={handleDelete}
        title="표 삭제"
      >
        <Trash2 size={12} />
      </button>

      {/* 개수 입력 팝오버 */}
      {popover ? (
        <div
          className="rich-table-popover"
          style={{
            position: "fixed",
            left: popover === "col" ? rect.right + 28 : rect.left + rect.width / 2,
            top: popover === "col" ? rect.top + rect.height / 2 - 16 : rect.bottom + 28,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="rich-table-popover-label">
            {popover === "col" ? "열" : "행"}:
          </span>
          <input
            autoFocus
            type="number"
            min={1}
            max={popover === "col" ? 20 : 50}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (popover === "col") handleAddCol();
                else handleAddRow();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setPopover(null);
              }
            }}
            className="rich-table-popover-input"
          />
          <button
            type="button"
            onClick={popover === "col" ? handleAddCol : handleAddRow}
            className="rich-table-popover-add"
          >
            추가
          </button>
        </div>
      ) : null}
    </div>
  );
}
