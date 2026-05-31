/**
 * 드래그가 위/아래 가장자리에 닿으면 자동 스크롤하기 위한 유틸.
 * 가장 가까운 세로 스크롤 조상을 찾고, 윈도/엘리먼트 스크롤을 한 추상화로 다룬다.
 */

/** 가장자리 감지 두께(px) */
const EDGE = 56;
/** 프레임당 최대 스크롤 속도(px) */
const MAX_SPEED = 16;

export interface Scroller {
  scrollTop: () => number;
  viewportTop: () => number;
  viewportBottom: () => number;
  scrollBy: (dy: number) => void;
}

/** el의 조상 중 세로 스크롤 가능한 가장 가까운 엘리먼트(없으면 null → 윈도) */
function findScrollableEl(el: HTMLElement | null): HTMLElement | null {
  let cur = el?.parentElement ?? null;
  while (cur) {
    const oy = getComputedStyle(cur).overflowY;
    if ((oy === "auto" || oy === "scroll") && cur.scrollHeight > cur.clientHeight) {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

/** 드래그 시작 시점에 스크롤러를 결정해 추상화한다. */
export function makeScroller(start: HTMLElement | null): Scroller {
  const el = findScrollableEl(start);
  if (!el) {
    return {
      scrollTop: () => window.scrollY,
      viewportTop: () => 0,
      viewportBottom: () => window.innerHeight,
      scrollBy: (dy) => window.scrollBy(0, dy),
    };
  }
  return {
    scrollTop: () => el.scrollTop,
    viewportTop: () => el.getBoundingClientRect().top,
    viewportBottom: () => el.getBoundingClientRect().bottom,
    scrollBy: (dy) => {
      el.scrollTop += dy;
    },
  };
}

/**
 * 현재 포인터 Y가 스크롤러 가장자리에 얼마나 가까운지에 따른 프레임당 스크롤 속도.
 * 위 가장자리면 음수, 아래 가장자리면 양수, 중앙이면 0.
 */
export function edgeVelocity(scroller: Scroller, clientY: number): number {
  const top = scroller.viewportTop();
  const bottom = scroller.viewportBottom();
  if (clientY < top + EDGE) {
    return -Math.ceil(((top + EDGE - clientY) / EDGE) * MAX_SPEED);
  }
  if (clientY > bottom - EDGE) {
    return Math.ceil(((clientY - (bottom - EDGE)) / EDGE) * MAX_SPEED);
  }
  return 0;
}
