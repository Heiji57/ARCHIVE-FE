import type { MarqueeRect } from "./marquee";

/**
 * 드래그 범위 선택 중 표시되는 사각형(마퀴) 오버레이.
 * `.rich-editor`(position: relative) 안에 절대배치되며 포인터 이벤트는 통과시킨다.
 */
export function DragSelectOverlay({ rect }: { rect: MarqueeRect | null }) {
  if (!rect) return null;
  return (
    <div
      className="rich-drag-marquee"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
