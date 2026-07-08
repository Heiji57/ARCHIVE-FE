/**
 * 일간 타임라인 드래그(이동/리사이즈/레인 배치)의 순수 계산 로직.
 * DayTimeline 의 드래그 프리뷰와 드롭 커밋이 같은 함수를 공유해
 * "놓았을 때 위치가 프리뷰와 달라지는" 문제를 구조적으로 막는다.
 */
import { MIN_BLOCK_MIN, assignLanes, type TimelineBlock } from "./timeline";

export interface Span {
  startMin: number;
  endMin: number;
}

/** 현재 시각(자정 기준 경과 분). */
export function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** 렌더 높이가 최소 MIN_BLOCK_MIN 이므로 레인 계산도 시각적 점유 구간 기준으로 한다. */
export function visualSpan(b: Span): Span {
  return {
    startMin: b.startMin,
    endMin: Math.max(b.endMin, b.startMin + MIN_BLOCK_MIN),
  };
}

export function overlapsSpan(a: Span, b: Span): boolean {
  return a.startMin < b.endMin && a.endMin > b.startMin;
}

/**
 * free 드래그 레이아웃: 드래그 블록을 새 시간(ns~ne)으로 옮기고 targetLane 선호를
 * 적용해 전체 레인을 재배치한다.
 */
export function layoutFreeDrag(
  blocks: TimelineBlock[],
  lanePrefs: Record<string, number>,
  dragId: string,
  ns: number,
  ne: number,
  targetLane: number,
): { layout: { lane: number; lanes: number }[]; prefs: Record<string, number> } {
  const dragSpan = visualSpan({ startMin: ns, endMin: ne });
  const spans = blocks.map((b) => (b.todo.id === dragId ? dragSpan : visualSpan(b)));
  // 드래그 블록이 노리는 레인을 선호하던 겹침 블록은 양보 (최근 드래그가 우선)
  const prefs: Record<string, number> = { [dragId]: targetLane };
  blocks.forEach((b, i) => {
    if (b.todo.id === dragId) return;
    const p = lanePrefs[b.todo.id];
    if (p === undefined) return;
    if (p === targetLane && overlapsSpan(spans[i], dragSpan)) return;
    prefs[b.todo.id] = p;
  });
  const layout = assignLanes(
    spans,
    blocks.map((b) => prefs[b.todo.id]),
  );
  return { layout, prefs };
}
