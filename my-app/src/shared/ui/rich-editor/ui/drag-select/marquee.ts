/** 마퀴(선택 사각형)의 컨테이너 상대 위치/크기 */
export interface MarqueeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 드래그가 "유효"하다고 볼 최소 이동 거리(px) — 단순 클릭과 구분 */
export const DRAG_THRESHOLD = 4;

/** 두 점(client 좌표)을 컨테이너 패딩 박스 기준 사각형으로 정규화 */
export function marqueeRect(
  container: HTMLElement,
  clientLeft: number,
  clientTop: number,
  clientRight: number,
  clientBottom: number,
): MarqueeRect {
  const box = container.getBoundingClientRect();
  return {
    left: Math.min(clientLeft, clientRight) - box.left,
    top: Math.min(clientTop, clientBottom) - box.top,
    width: Math.abs(clientRight - clientLeft),
    height: Math.abs(clientBottom - clientTop),
  };
}
