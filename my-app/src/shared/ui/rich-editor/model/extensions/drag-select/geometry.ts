import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/** doc 직계 자식(최상위 블록) 1개의 위치 정보 */
export interface TopBlock {
  /** doc 안에서의 인덱스 */
  index: number;
  /** 블록 노드 시작 position (노드 앞) */
  from: number;
  /** 블록 노드 끝 position (노드 뒤 = 다음 블록 시작) */
  to: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/**
 * 현재 문서의 모든 최상위 블록 목록을 위치 정보와 함께 수집.
 * (toggle / callout / table 등 중첩 노드도 "통째로" 하나의 최상위 블록으로 취급)
 */
export function topLevelBlocks(state: EditorState): TopBlock[] {
  const blocks: TopBlock[] = [];
  state.doc.forEach((node, offset, index) => {
    blocks.push({ index, from: offset, to: offset + node.nodeSize });
  });
  return blocks;
}

/** position이 속한 최상위 블록 인덱스. 못 찾으면 양 끝으로 클램프. */
export function blockIndexForPos(blocks: TopBlock[], pos: number): number {
  for (let i = 0; i < blocks.length; i += 1) {
    if (pos >= blocks[i].from && pos < blocks[i].to) return i;
  }
  if (blocks.length > 0 && pos >= blocks[blocks.length - 1].to) {
    return blocks.length - 1;
  }
  return blocks.length > 0 ? 0 : -1;
}

/**
 * 화면 좌표(clientX/Y)가 가리키는 최상위 블록 인덱스.
 *  - 좌표를 에디터 본문 박스 안으로 클램프 → 왼쪽 여백/위·아래로 벗어난 드래그도
 *    가장 가까운 블록으로 매핑된다 (노션처럼 거터에서 시작/끝 가능).
 */
export function blockIndexAtClientPoint(
  view: EditorView,
  blocks: TopBlock[],
  clientX: number,
  clientY: number,
): number | null {
  if (blocks.length === 0) return null;
  const box = view.dom.getBoundingClientRect();
  const x = clamp(clientX, box.left + 2, box.right - 2);
  const y = clamp(clientY, box.top + 2, box.bottom - 2);
  const hit = view.posAtCoords({ left: x, top: y });
  if (!hit) return null;
  return blockIndexForPos(blocks, hit.pos);
}

/** 최상위 블록의 화면(client) 사각형. NodeView/래퍼 노드도 처리. */
export function blockClientRect(
  view: EditorView,
  block: TopBlock,
): DOMRect | null {
  const dom = view.nodeDOM(block.from);
  if (dom instanceof HTMLElement) return dom.getBoundingClientRect();
  return null;
}

/**
 * 화면 좌표가 "실제 블록 위"에 있으면 그 인덱스, 빈 영역(여백·본문 아래)이면 null.
 * → 드래그 시작이 "글 작성 영역 안인지/밖인지" 판정에 사용.
 */
export function blockAtPoint(
  view: EditorView,
  blocks: TopBlock[],
  clientX: number,
  clientY: number,
): number | null {
  for (let i = 0; i < blocks.length; i += 1) {
    const r = blockClientRect(view, blocks[i]);
    if (!r) continue;
    if (
      clientX >= r.left &&
      clientX <= r.right &&
      clientY >= r.top &&
      clientY <= r.bottom
    ) {
      return i;
    }
  }
  return null;
}

/**
 * 세로 구간 [top, bottom](client 좌표)과 겹치는 최상위 블록 인덱스 목록.
 * 마퀴는 왼쪽 여백에 그려질 수 있어 가로는 보지 않고 세로 겹침만 본다(노션과 동일).
 */
export function blocksIntersectingVertical(
  view: EditorView,
  blocks: TopBlock[],
  top: number,
  bottom: number,
): number[] {
  const hits: number[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const r = blockClientRect(view, blocks[i]);
    if (!r) continue;
    if (r.bottom >= top && r.top <= bottom) hits.push(i);
  }
  return hits;
}
