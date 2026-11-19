/**
 * 빗금이(hx10) SVG 경로 — 런타임 라이브러리 없이 손으로 만든 경로.
 * hx10: 가로×세로 48px, 대각선 빗금이 얼굴을 덮고 눈 두 개가 마스크로 뚫림.
 *
 * 원본: prototype/linear-shell/shared/pet.js hx(10, ...) 함수에서 추출.
 * 빗금 갭 4.5px, 얼굴 rx=6, 눈 w=6 h=12.
 */

/** hatch(0, 0, 48, 48, gap) — gap=4.5 */
export const HATCH_PATH_NORMAL =
  "M-9 0l48 48M-4.5 0l48 48M0 0l48 48M4.5 0l48 48M9 0l48 48M13.5 0l48 48M18 0l48 48M22.5 0l48 48M27 0l48 48M31.5 0l48 48M36 0l48 48M40.5 0l48 48M45 0l48 48M49.5 0l48 48M54 0l48 48M58.5 0l48 48M63 0l48 48M67.5 0l48 48";

/** 작은 크기(px < 40)용 — gap=8 */
export const HATCH_PATH_SMALL =
  "M-16 0l48 48M-8 0l48 48M0 0l48 48M8 0l48 48M16 0l48 48M24 0l48 48M32 0l48 48M40 0l48 48M48 0l48 48M56 0l48 48M64 0l48 48";

/** 눈 위치 (hx10: mask 방식) */
export const EYE_LEFT = { x: 13, y: 17, w: 6, h: 12, rx: 1.5 };
export const EYE_RIGHT = { x: 29, y: 17, w: 6, h: 12, rx: 1.5 };
