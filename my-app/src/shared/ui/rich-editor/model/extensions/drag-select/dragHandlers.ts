import { Plugin } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import {
  BLOCK_SELECTING_CLASS,
  dragSelectPluginKey,
} from "./pluginKey";
import { blockAtPoint, blockIndexAtClientPoint, topLevelBlocks } from "./geometry";
import {
  applyBlockRange,
  blockSelectionDecorations,
  blocksCoveringSelection,
} from "./blockSelection";

/** 무시할 오버레이/핸들 요소 (이들 위에서 시작한 드래그는 각자 처리) */
const IGNORE_SELECTOR =
  ".rich-block-handle, .rich-block-menu, .rich-table-handle, .rich-toggle-arrow";

/**
 * 노션 스타일 드래그 범위(블록) 선택 플러그인.
 *
 * 동작
 *  - 같은 블록 안 드래그   → 아무것도 안 함 (ProseMirror 기본 텍스트 선택)
 *  - 블록 경계를 넘어가면   → 닿은 모든 최상위 블록을 풀폭 하이라이트로 선택
 *  - 실제 선택은 첫 블록~끝 블록을 감싸는 TextSelection → Delete/Ctrl+C 등 자동 동작
 *  - 마우스를 떼도 선택 유지 (다른 곳 클릭/키 입력 시 해제)
 *
 * 하이라이트/네이티브 ::selection 숨김은 모두 "현재 selection"에서 파생하므로
 * 키보드 Shift 선택이 블록을 넘어가도 동일하게 동작한다.
 */
export function createDragSelectPlugin(): Plugin {
  let dragging = false;
  let anchorIdx = -1;
  let blockMode = false;
  let onMove: ((e: MouseEvent) => void) | null = null;
  let onUp: (() => void) | null = null;

  const detach = () => {
    if (onMove) window.removeEventListener("mousemove", onMove);
    if (onUp) window.removeEventListener("mouseup", onUp);
    onMove = null;
    onUp = null;
  };

  const handleMove = (view: EditorView, e: MouseEvent) => {
    if (!dragging) return;
    const blocks = topLevelBlocks(view.state);
    if (anchorIdx < 0 || anchorIdx >= blocks.length) return;

    const curIdx = blockIndexAtClientPoint(view, blocks, e.clientX, e.clientY);
    if (curIdx === null) return;

    // 아직 같은 블록 안 → 일반 텍스트 선택에 맡긴다
    if (curIdx === anchorIdx && !blockMode) return;

    // 경계를 넘었거나 이미 블록모드 → 네이티브 텍스트 드래그 차단 + 블록 선택
    e.preventDefault();
    blockMode = true;
    applyBlockRange(view, blocks, anchorIdx, curIdx);
  };

  return new Plugin({
    key: dragSelectPluginKey,
    props: {
      decorations: (state) => blockSelectionDecorations(state),
      handleDOMEvents: {
        mousedown(view, event) {
          if (event.button !== 0) return false;
          const target = event.target as HTMLElement | null;
          if (target?.closest?.(IGNORE_SELECTOR)) return false;

          // 실제 블록 위에서 시작한 드래그만 처리. 빈 영역(여백·본문 아래)에서
          // 시작한 라소는 useDragSelect 훅이 담당한다.
          const blocks = topLevelBlocks(view.state);
          const idx = blockAtPoint(view, blocks, event.clientX, event.clientY);
          if (idx === null) return false;

          detach(); // 혹시 남아있는 이전 드래그 리스너 정리
          dragging = true;
          anchorIdx = idx;
          blockMode = false;

          onMove = (e) => handleMove(view, e);
          onUp = () => {
            dragging = false;
            blockMode = false;
            detach();
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);

          // 기본 동작 유지 (커서 배치 + 같은 블록 텍스트 선택)
          return false;
        },
      },
    },
    view(editorView) {
      const sync = (v: EditorView) => {
        v.dom.classList.toggle(
          BLOCK_SELECTING_CLASS,
          blocksCoveringSelection(v.state) !== null,
        );
      };
      sync(editorView);
      return {
        update: sync,
        destroy: detach,
      };
    },
  });
}
