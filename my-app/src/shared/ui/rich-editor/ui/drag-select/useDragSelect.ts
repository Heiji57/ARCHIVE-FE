import { useEffect, useRef, useState, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import {
  blockAtPoint,
  blocksIntersectingVertical,
  topLevelBlocks,
} from "../../model/extensions/drag-select/geometry";
import { applyBlockRange } from "../../model/extensions/drag-select/blockSelection";
import { DRAG_THRESHOLD, marqueeRect, type MarqueeRect } from "./marquee";
import { edgeVelocity, makeScroller, type Scroller } from "./autoScroll";

const IGNORE_SELECTOR =
  ".rich-block-handle, .rich-block-menu, .rich-table-handle, .rich-toggle-arrow";

/**
 * 노션 스타일 "바깥에서 시작하는" 드래그 범위 선택 + 마퀴 사각형 + 자동 스크롤.
 *
 *  - 글 작성 영역(블록) 위에서 시작한 드래그는 무시 → 편집영역 내부 드래그 플러그인이 담당.
 *  - 빈 영역(여백·본문 아래)에서 시작하면 라소 모드: 사각형을 그리며 세로로 겹친 블록을 선택.
 *  - rAF 루프가 매 프레임 현재 scrollTop으로 다시 계산 → 자동 스크롤로 드러난 블록도 선택.
 *
 * 반환값(MarqueeRect | null)을 DragSelectOverlay에 넘겨 사각형을 렌더한다.
 */
export function useDragSelect(
  editor: Editor | null,
  containerRef: RefObject<HTMLElement | null>,
): MarqueeRect | null {
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const rectRef = useRef<MarqueeRect | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!editor || !container) return;
    const view = editor.view;

    let active = false;
    let focused = false;
    let anchorContentY = 0;
    let anchorClientX = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let raf = 0;
    let scroller: Scroller | null = null;

    const setRectThrottled = (next: MarqueeRect | null) => {
      const prev = rectRef.current;
      if (
        prev &&
        next &&
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height
      ) {
        return;
      }
      rectRef.current = next;
      setRect(next);
    };

    const tick = () => {
      if (!active || !scroller) return;
      const sTop = scroller.scrollTop();
      const vTop = scroller.viewportTop();
      // 앵커는 content 좌표로 고정 → 스크롤해도 문서 기준 위치 유지
      const anchorClientY = anchorContentY - sTop + vTop;
      const clientTop = Math.min(anchorClientY, lastClientY);
      const clientBottom = Math.max(anchorClientY, lastClientY);

      const movedEnough =
        Math.abs(lastClientY - anchorClientY) >= DRAG_THRESHOLD ||
        Math.abs(lastClientX - anchorClientX) >= DRAG_THRESHOLD;

      if (movedEnough) {
        const blocks = topLevelBlocks(view.state);
        const hits = blocksIntersectingVertical(
          view,
          blocks,
          clientTop,
          clientBottom,
        );
        if (hits.length > 0) {
          if (!focused) {
            view.focus();
            focused = true;
          }
          applyBlockRange(view, blocks, hits[0], hits[hits.length - 1]);
        }
        setRectThrottled(
          marqueeRect(container, anchorClientX, clientTop, lastClientX, clientBottom),
        );
      }

      const dy = edgeVelocity(scroller, lastClientY);
      if (dy !== 0) scroller.scrollBy(dy);

      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      active = false;
      focused = false;
      scroller = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      setRectThrottled(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    const onMove = (e: MouseEvent) => {
      if (!active) return;
      e.preventDefault();
      lastClientX = e.clientX;
      lastClientY = e.clientY;
    };

    const onUp = () => stop();

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(IGNORE_SELECTOR)) return;

      const blocks = topLevelBlocks(view.state);
      // 실제 블록 위에서 시작 → 내부 드래그 플러그인/네이티브에 맡긴다
      if (blockAtPoint(view, blocks, e.clientX, e.clientY) !== null) return;

      // 여기서 preventDefault 하지 않음 → 빈 영역 단순 클릭은 평소대로 동작.
      // 실제 드래그(onMove)로 넘어가야 네이티브 선택을 차단한다.
      scroller = makeScroller(container);
      active = true;
      focused = false;
      anchorContentY = e.clientY - scroller.viewportTop() + scroller.scrollTop();
      anchorClientX = e.clientX;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      raf = requestAnimationFrame(tick);
    };

    container.addEventListener("mousedown", onDown);
    return () => {
      container.removeEventListener("mousedown", onDown);
      stop();
    };
  }, [editor, containerRef]);

  return rect;
}
