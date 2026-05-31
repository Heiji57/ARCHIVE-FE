import { InputRule, mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { appendToggleInsertion } from "./helpers";
import { ToggleView } from "./ToggleView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: () => ReturnType;
      toggleToggleOpen: () => ReturnType;
    };
  }
}

/**
 * 토글 부모 컨테이너 노드 (open 속성 보유).
 *  - 화면 렌더링은 React NodeView(ToggleView)로 처리.
 *  - 직렬화 시엔 표준 <details> HTML로 출력.
 */
export const ToggleNode = Node.create({
  name: "toggle",
  group: "block",
  content: "toggleSummary toggleBody",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (element) => element.hasAttribute("open"),
        renderHTML: (attrs) => (attrs.open ? { open: "" } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "details" }];
  },

  // 마크다운/직렬화 시엔 표준 <details> HTML로 출력
  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, { class: "rich-toggle" }),
      0,
    ];
  },

  // 화면 렌더링은 React NodeView로 — open 상태 토글 + 편집 가능한 자식
  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ chain, state }) =>
          appendToggleInsertion(chain(), state.selection.from).run(),
      toggleToggleOpen:
        () =>
        ({ commands, state }) => {
          const { $from } = state.selection;
          for (let d = $from.depth; d >= 0; d -= 1) {
            const node = $from.node(d);
            if (node.type.name === "toggle") {
              return commands.updateAttributes("toggle", {
                open: !node.attrs.open,
              });
            }
          }
          return false;
        },
    };
  },

  // 단축키: Ctrl/Cmd + Enter → 펼침/접힘 토글
  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.toggleToggleOpen(),
    };
  },

  // `>>` + 공백 입력 룰
  addInputRules() {
    return [
      new InputRule({
        find: /^>>\s$/,
        handler: ({ chain, range }) => {
          appendToggleInsertion(chain().deleteRange(range), range.from).run();
        },
      }),
    ];
  },
});
