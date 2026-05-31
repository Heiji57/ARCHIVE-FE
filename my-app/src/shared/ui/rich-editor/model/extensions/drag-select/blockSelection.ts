import { TextSelection, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { BLOCK_SELECTED_CLASS } from "./pluginKey";
import { blockIndexForPos, topLevelBlocks, type TopBlock } from "./geometry";

export interface BlockSpan {
  blocks: TopBlock[];
  fromIdx: number;
  toIdx: number;
}

/**
 * 현재 selection이 2개 이상의 최상위 블록에 걸쳐 있으면 그 블록 범위를 반환.
 * 같은 블록 안의 텍스트 선택(또는 빈 선택)이면 null → 일반 텍스트 선택으로 둔다.
 */
export function blocksCoveringSelection(state: EditorState): BlockSpan | null {
  const { from, to, empty } = state.selection;
  if (empty) return null;

  const blocks = topLevelBlocks(state);
  if (blocks.length === 0) return null;

  const fromIdx = blockIndexForPos(blocks, from);
  // to는 블록 경계(다음 블록 시작)에 닿는 경우가 많아 to-1 기준으로 판정
  const toIdx = blockIndexForPos(blocks, Math.max(from, to - 1));

  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return null;
  return { blocks, fromIdx: Math.min(fromIdx, toIdx), toIdx: Math.max(fromIdx, toIdx) };
}

/**
 * 선택에 걸친 모든 최상위 블록을 풀폭 하이라이트하는 노드 데코레이션 집합.
 */
export function blockSelectionDecorations(state: EditorState): DecorationSet {
  const span = blocksCoveringSelection(state);
  if (!span) return DecorationSet.empty;

  const decorations: Decoration[] = [];
  for (let i = span.fromIdx; i <= span.toIdx; i += 1) {
    const b = span.blocks[i];
    decorations.push(
      Decoration.node(b.from, b.to, { class: BLOCK_SELECTED_CLASS }),
    );
  }
  return DecorationSet.create(state.doc, decorations);
}

/**
 * 블록 인덱스 범위 [lo..hi]를 감싸는 TextSelection을 설정(dispatch).
 * 첫 블록 시작~끝 블록 끝을 TextSelection.between으로 잡아 Delete/Ctrl+C 등이 동작.
 * 드래그 내부 플러그인과 바깥 라소 훅이 공유한다.
 */
export function applyBlockRange(
  view: EditorView,
  blocks: TopBlock[],
  lo: number,
  hi: number,
): void {
  if (lo < 0 || hi < 0 || lo >= blocks.length || hi >= blocks.length) return;
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  const $from = view.state.doc.resolve(blocks[a].from);
  const $to = view.state.doc.resolve(blocks[b].to);
  const selection = TextSelection.between($from, $to);
  if (view.state.selection.eq(selection)) return;
  const tr = view.state.tr.setSelection(selection);
  tr.setMeta("addToHistory", false);
  view.dispatch(tr);
}
