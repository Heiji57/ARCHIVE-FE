import { useEffect, useRef, type RefObject } from "react";

/**
 * 슬래시 메뉴 스크롤 — 선택된 항목을 viewport 가운데로 정렬.
 *  · 한 칸씩 이동(인접) → 부드러운 smooth scroll
 *  · 큰 점프(wraparound, 마우스 점프) → 즉시 (instant) 순간이동
 *
 * 컨테이너/항목 ref는 호출하는 컴포넌트가 소유하고 인자로 전달한다.
 */
export function useSlashMenuScroll(
  selectedIndex: number,
  containerRef: RefObject<HTMLDivElement | null>,
  itemRefs: RefObject<Array<HTMLButtonElement | null>>,
) {
  // 이전 선택 인덱스 — wraparound/마우스 점프 감지용
  const prevIndexRef = useRef(selectedIndex);

  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    const container = containerRef.current;
    const prev = prevIndexRef.current;
    prevIndexRef.current = selectedIndex;
    if (!el || !container) return;

    const isJump = Math.abs(selectedIndex - prev) > 1;

    const raf = requestAnimationFrame(() => {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // 항목의 컨테이너 내부 top (scroll 무관 절대 위치)
      const elTopInContainer =
        elRect.top - containerRect.top + container.scrollTop;
      // 항목 중심이 viewport 중심에 오는 scrollTop
      const targetTop =
        elTopInContainer - (containerRect.height - elRect.height) / 2;

      const maxScroll = Math.max(
        0,
        container.scrollHeight - container.clientHeight,
      );
      const clampedTarget = Math.max(0, Math.min(targetTop, maxScroll));

      // 거의 변화 없으면 skip (불필요한 rerender 방지)
      if (Math.abs(clampedTarget - container.scrollTop) < 1) return;

      if (isJump) {
        // wraparound 또는 마우스 점프 → 명시적 instant (CSS 영향 무시)
        container.scrollTo({ top: clampedTarget, behavior: "auto" });
      } else {
        // 한 칸 이동 → 부드러운 가운데 정렬
        container.scrollTo({ top: clampedTarget, behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [selectedIndex, containerRef, itemRefs]);
}
