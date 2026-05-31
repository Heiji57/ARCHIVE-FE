import { Plus } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useTableControls } from "./useTableControls";

/**
 * 표 사이드 핸들 (Notion 스타일).
 *  - 우측 세로 +바: 표 높이만큼, 우측 드래그=열 추가, 좌측 드래그=열 삭제
 *  - 하단 가로 +바: 표 너비만큼, 아래 드래그=행 추가, 위 드래그=행 삭제
 *  - 클릭만 하면 1개 추가
 *  - 표 삭제는 BlockHandle 메뉴에서 처리 (별도 휴지통 없음)
 */
export function TableControls({ editor }: { editor: Editor }) {
  const { target, rect, startDrag, onBarClick } = useTableControls(editor);

  if (!target || !rect) return null;

  return (
    <>
      {/* 우측 세로 +바 — 표 높이 전체 */}
      <div
        className="rich-table-handle rich-table-handle-col"
        style={{
          position: "fixed",
          left: rect.right + 2,
          top: rect.top,
          height: rect.height,
        }}
        onMouseDown={(e) => startDrag("col", e)}
        onClick={(e) => onBarClick("col", e)}
        title="우측으로 드래그=열 추가, 좌측으로 드래그=열 삭제 (클릭=1개 추가)"
      >
        <Plus size={12} />
      </div>

      {/* 하단 가로 +바 — 표 너비 전체 */}
      <div
        className="rich-table-handle rich-table-handle-row"
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.bottom + 2,
          width: rect.width,
        }}
        onMouseDown={(e) => startDrag("row", e)}
        onClick={(e) => onBarClick("row", e)}
        title="아래로 드래그=행 추가, 위로 드래그=행 삭제 (클릭=1개 추가)"
      >
        <Plus size={12} />
      </div>
    </>
  );
}
