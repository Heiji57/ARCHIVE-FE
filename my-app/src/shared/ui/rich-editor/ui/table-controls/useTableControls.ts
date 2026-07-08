import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

const COL_DRAG_THRESHOLD = 90; // px per column
const ROW_DRAG_THRESHOLD = 32; // px per row

type Axis = "col" | "row";

/**
 * 표 사이드 핸들 로직 — 호버 추적 + 행/열 추가·삭제 + 드래그 처리.
 *  - 우측 드래그=열 추가, 좌측 드래그=열 삭제
 *  - 아래 드래그=행 추가, 위 드래그=행 삭제
 *  - 클릭(드래그 0칸)=1개 추가
 */
export function useTableControls(editor: Editor) {
  const [target, setTarget] = useState<HTMLTableElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const dragRef = useRef<{
    axis: Axis;
    startX: number;
    startY: number;
    delta: number; // 이번 드래그 세션에서 추가(+) 또는 삭제(-)된 수
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
      if (related?.closest?.(".rich-table-handle")) return;
      if (related && target?.contains(related)) return;
      if (dragRef.current) return;
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

  // 마지막 행/열의 셀로 selection을 이동
  const moveSelectionToTable = (axis: Axis) => {
    if (!target) return false;
    const rows = Array.from(target.querySelectorAll("tr"));
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return false;
    const cells = Array.from(lastRow.querySelectorAll("th, td"));
    const cell = axis === "col" ? cells[cells.length - 1] : cells[0];
    if (!cell) return false;
    const pos = editor.view.posAtDOM(cell, 0);
    if (pos < 0) return false;
    editor.chain().focus().setTextSelection(pos + 1).run();
    return true;
  };

  const addOne = (axis: Axis) => {
    if (!moveSelectionToTable(axis)) return;
    if (axis === "col") editor.chain().focus().addColumnAfter().run();
    else editor.chain().focus().addRowAfter().run();
  };

  const removeOne = (axis: Axis) => {
    if (!target) return;
    const rows = Array.from(target.querySelectorAll("tr"));
    if (axis === "col") {
      const lastRow = rows[rows.length - 1];
      if (!lastRow) return;
      const cellCount = lastRow.querySelectorAll("th, td").length;
      if (cellCount <= 1) return; // 최소 1열 유지
    } else {
      if (rows.length <= 1) return; // 최소 1행 유지
    }
    if (!moveSelectionToTable(axis)) return;
    if (axis === "col") editor.chain().focus().deleteColumn().run();
    else editor.chain().focus().deleteRow().run();
  };

  // 드래그 처리
  const onDrag = (e: MouseEvent) => {
    const d = dragRef.current;
    if (!d || !target) return;
    const px = d.axis === "col" ? e.clientX - d.startX : e.clientY - d.startY;
    const threshold = d.axis === "col" ? COL_DRAG_THRESHOLD : ROW_DRAG_THRESHOLD;
    // 정확한 칸 차이 (양수: 추가, 음수: 삭제)
    const desired = Math.trunc(px / threshold);

    // 따라잡기: 부족하면 추가, 넘치면 삭제
    while (d.delta < desired) {
      addOne(d.axis);
      d.delta += 1;
    }
    while (d.delta > desired) {
      removeOne(d.axis);
      d.delta -= 1;
    }

    setRect(target.getBoundingClientRect());
  };

  const onDragEnd = () => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", onDragEnd);
    // 드래그 종료 시 커서 원복(이벤트 핸들러 내 DOM 조작) — immutability 오탐 예외.
    // eslint-disable-next-line react-hooks/immutability
    document.body.style.cursor = "";
  };

  const startDrag = (axis: Axis, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!target) return;
    dragRef.current = { axis, startX: e.clientX, startY: e.clientY, delta: 0 };
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", onDragEnd);
    document.body.style.cursor = axis === "col" ? "ew-resize" : "ns-resize";
  };

  // 클릭(드래그 0칸)이면 1개 추가
  const onBarClick = (axis: Axis, e: React.MouseEvent) => {
    if (!dragRef.current || dragRef.current.delta === 0) {
      e.stopPropagation();
      addOne(axis);
    }
  };

  return { target, rect, startDrag, onBarClick };
}
