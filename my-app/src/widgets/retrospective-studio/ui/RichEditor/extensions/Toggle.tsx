import { InputRule, mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: () => ReturnType;
      toggleToggleOpen: () => ReturnType;
    };
  }
}

/* ============================================================
   Notion 스타일 토글 — 3개 노드:
     toggle: 부모 컨테이너 (open 속성 보유)
       ├── toggleSummary: 편집 가능한 제목 (inline)
       └── toggleBody:    편집 가능한 본문 (block+)
   ============================================================ */

// 화살표를 ReactNodeView로 직접 렌더링
function ToggleView({ node, updateAttributes }: NodeViewProps) {
  const open = node.attrs.open as boolean;
  return (
    <NodeViewWrapper
      as="div"
      className="rich-toggle"
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        className="rich-toggle-arrow"
        contentEditable={false}
        suppressContentEditableWarning
        onMouseDown={(e) => {
          // ProseMirror가 selection 이동 안 시키게
          e.preventDefault();
          e.stopPropagation();
          updateAttributes({ open: !open });
        }}
        aria-label={open ? "토글 닫기" : "토글 열기"}
      >
        ▶
      </button>
      <NodeViewContent as="div" className="rich-toggle-children" />
    </NodeViewWrapper>
  );
}

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
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { open: true },
              content: [
                {
                  type: "toggleSummary",
                  content: [{ type: "text", text: "토글" }],
                },
                {
                  type: "toggleBody",
                  content: [{ type: "paragraph" }],
                },
              ],
            })
            .run(),
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
    const name = this.name;
    return [
      new InputRule({
        find: /^>>\s$/,
        handler: ({ chain, range }) => {
          chain()
            .deleteRange(range)
            .insertContent({
              type: name,
              attrs: { open: true },
              content: [
                {
                  type: "toggleSummary",
                  content: [{ type: "text", text: "토글" }],
                },
                {
                  type: "toggleBody",
                  content: [{ type: "paragraph" }],
                },
              ],
            })
            .run();
        },
      }),
    ];
  },
});

export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,
  selectable: false,

  parseHTML() {
    return [{ tag: "summary" }];
  },

  renderHTML() {
    return ["summary", { class: "rich-toggle-summary" }, 0];
  },

  // 빈 summary에서 Backspace → 부모 toggle 노드 통째 삭제
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;
        // 현재 위치가 toggleSummary 노드의 시작이고
        if ($from.parent.type.name !== "toggleSummary") return false;
        if ($from.parentOffset !== 0) return false;
        // 비어있는지 (텍스트 길이 0)
        if ($from.parent.content.size > 0) return false;
        // 부모 toggle 노드 찾아서 삭제
        for (let d = $from.depth - 1; d >= 0; d -= 1) {
          const node = $from.node(d);
          if (node.type.name === "toggle") {
            const pos = $from.before(d);
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .run();
            return true;
          }
        }
        return false;
      },
    };
  },
});

export const ToggleBody = Node.create({
  name: "toggleBody",
  content: "block+",
  defining: true,
  selectable: false,

  parseHTML() {
    return [{ tag: 'div[data-toggle-body="true"]' }];
  },

  renderHTML() {
    return [
      "div",
      { "data-toggle-body": "true", class: "rich-toggle-body" },
      0,
    ];
  },
});
