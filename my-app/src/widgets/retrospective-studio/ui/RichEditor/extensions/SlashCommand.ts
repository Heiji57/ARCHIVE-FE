import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/core";

/**
 * 직접 구현한 슬래시 커맨드 (Suggestion plugin 사용 안 함).
 *
 * 동작:
 *  - `/` 입력 감지 → onOpen 호출 (popup 띄우기)
 *  - 이어지는 입력 → onQuery 호출 (필터링)
 *  - Esc/공백/줄바꿈 → onClose 호출
 *
 * popup의 키보드(↑↓ Enter)는 RichEditor에서 별도로 keydown 처리.
 */
export interface SlashCommandOptions {
  onOpen: (params: { editor: Editor; range: { from: number; to: number }; clientRect: DOMRect | null }) => void;
  onQuery: (query: string) => void;
  onClose: () => void;
  /** 활성 상태인지 묻기 — popup 열려있을 때 enter/arrow 막기 위해 */
  isActive: () => boolean;
  /** 활성 상태에서 키 처리 (true 반환 시 ProseMirror 키 기본 동작 중단) */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const slashKey = new PluginKey("slashCommand");

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      onOpen: () => {},
      onQuery: () => {},
      onClose: () => {},
      isActive: () => false,
      onKeyDown: () => false,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const editor = this.editor;

    return [
      new Plugin({
        key: slashKey,
        state: {
          init: () => ({ active: false, from: 0, query: "" }),
          apply(tr, prev) {
            const meta = tr.getMeta(slashKey);
            if (meta) return { ...prev, ...meta };
            // doc/selection 변경에 따라 query 갱신
            if (prev.active) {
              const { from } = prev;
              const head = tr.selection.from;
              if (head < from) return { active: false, from: 0, query: "" };
              const text = tr.doc.textBetween(from, head, "\n");
              if (!text.startsWith("/")) return { active: false, from: 0, query: "" };
              // 공백 또는 줄바꿈이 들어오면 종료
              if (/\s/.test(text)) return { active: false, from: 0, query: "" };
              return { ...prev, query: text.slice(1) };
            }
            return prev;
          },
        },
        props: {
          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            // active 상태면 popup이 키 처리
            const state = slashKey.getState(view.state);
            if (state?.active) {
              if (options.onKeyDown(event)) return true;
            }

            if (event.key !== "/") return false;
            // `/` 입력 → 다음 frame에서 popup 열기
            requestAnimationFrame(() => {
              const { from } = view.state.selection;
              // 같은 위치에서 시작 (직전 textBefore 확인)
              const $pos = view.state.doc.resolve(from);
              const before = $pos.nodeBefore?.text ?? "";
              // 직전 글자가 일반 텍스트면 슬래시 무시(예: "10/24")
              if (before && !/\s$/.test(before)) return;

              view.dispatch(view.state.tr.setMeta(slashKey, {
                active: true,
                from,  // 슬래시가 들어간 위치
                query: "",
              }));

              const coords = view.coordsAtPos(from);
              const rect = new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top);
              options.onOpen({ editor, range: { from, to: from + 1 }, clientRect: rect });
            });
            return false;  // `/` 자체는 그대로 입력되게
          },
        },
        view() {
          let lastQuery = "";
          let lastActive = false;
          return {
            update(view) {
              const state = slashKey.getState(view.state);
              if (!state) return;
              if (state.active && !lastActive) {
                lastActive = true;
              } else if (!state.active && lastActive) {
                lastActive = false;
                options.onClose();
              }
              if (state.active && state.query !== lastQuery) {
                lastQuery = state.query;
                options.onQuery(state.query);
              }
            },
          };
        },
      }),
    ];
  },
});

export { slashKey };
