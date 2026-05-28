import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

/**
 * Notion 스타일 표 컨트롤.
 *  - 우측 세로 +바: 표 높이만큼 — 드래그하면 우측으로 끌어당긴 거리만큼 열 추가
 *  - 하단 가로 +바: 표 너비만큼 — 드래그하면 아래로 끌어당긴 거리만큼 행 추가
 *  - 좌상단 휴지통: 표 삭제
 *
 * 드래그 동작: 약 80px(셀 평균)마다 1행/열 추가.
 */

const ROW_DRAG_THRESHOLD = 32; // px (행 1개 추가에 필요한 드래그 거리)
const COL_DRAG_THRESHOLD = 90; // px

export function TableControls({ editor }: { editor: Editor }) {
  const [target, setTarget] = useState<HTMLTableElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const dragRef = useRef<{
    axis: "col" | "row";
    startX: number;
    startY: number;
    added: number;
  } | null>(null);

  // 호버한 표 추적
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

    const onMouseLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      // 핸들 자신 위에 있으면 유지
      if (related?.closest?.(".rich-table-handle, .rich-table-btn")) return;
      if (related && target?.contains(related)) return;
      if (dragRef.current) return; // 드래그 중이면 유지
      setTarget(null);
      setRect(null);
    };

    const onScrollOrResize = () => {
      if (target) setRect(target.getBoundingClientRect());
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
  }, [editor, target]);

  // 드래그 처리
  const startDrag = (axis: "col" | "row", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!target) return;
    dragRef.current = {
      axis,
      startX: e.clientX,
      startY: e.clientY,
      added: 0,
    };
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", onDragEnd);
    document.body.style.cursor = axis === "col" ? "ew-resize" : "ns-resize";
  };

  const onDrag = (e: MouseEvent) => {
    const d = dragRef.current;
    if (!d || !target) return;
    const delta = d.axis === "col" ? e.clientX - d.startX : e.clientY - d.startY;
    const threshold = d.axis === "col" ? COL_DRAG_THRESHOLD : ROW_DRAG_THRESHOLD;
    const targetAdded = Math.max(0, Math.floor(delta / threshold));
    // 드래그 거리가 늘어난 만큼 칸 추가 (줄어들면 제거 — 마지막 추가분만)
    while (d.added < targetAdded) {
      if (d.axis === "col") editor.chain().focus().addColumnAfter().run();
      else editor.chain().focus().addRowAfter().run();
      d.added += 1;
    }
    while (d.added > targetAdded) {
      // 드래그 중에는 줄이지 않음 — 단순하게 가자 (방향 거꾸로면 무시)
      break;
    }
    // 표 사이즈가 바뀌었으니 rect 다시
    setRect(target.getBoundingClientRect());
  };

  const onDragEnd = () => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", onDragEnd);
    document.body.style.cursor = "";
  };

  const handleDelete = () => {
    editor.chain().focus().deleteTable().run();
    setTarget(null);
    setRect(null);
  };

  if (!target || !rect) return null;

  return (
    <>
      {/* 우측 +바 — 표 높이 전체 */}
      <div
        className="rich-table-handle rich-table-handle-col"
        style={{
          position: "fixed",
          left: rect.right + 2,
          top: rect.top,
          height: rect.height,
        }}
        onMouseDown={(e) => startDrag("col", e)}
        onClick={(e) => {
          // 클릭(드래그 없이)이면 1개만 추가
          if (!dragRef.current || dragRef.current.added === 0) {
            e.stopPropagation();
            editor.chain().focus().addColumnAfter().run();
          }
        }}
        title="우측으로 드래그하여 열 추가"
      >
        <Plus size={12} />
      </div>

      {/* 하단 +바 — 표 너비 전체 */}
      <div
        className="rich-table-handle rich-table-handle-row"
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.bottom + 2,
          width: rect.width,
        }}
        onMouseDown={(e) => startDrag("row", e)}
        onClick={(e) => {
          if (!dragRef.current || dragRef.current.added === 0) {
            e.stopPropagation();
            editor.chain().focus().addRowAfter().run();
          }
        }}
        title="아래로 드래그하여 행 추가"
      >
        <Plus size={12} />
      </div>

      {/* 좌상단 삭제 */}
      <button
        type="button"
        className="rich-table-btn rich-table-btn-delete"
        style={{
          position: "fixed",
          left: rect.left - 28,
          top: rect.top - 4,
        }}
        onClick={handleDelete}
        title="표 삭제"
      >
        <Trash2 size={12} />
      </button>
    </>
  );
}
