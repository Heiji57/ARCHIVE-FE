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
        ({ chain, state }) => {
          const beforePos = state.selection.from;
          let summaryPos = -1;
          return chain()
            .insertContent({
              type: this.name,
              attrs: { open: true },
              content: [
                { type: "toggleSummary" },
                { type: "toggleBody", content: [{ type: "paragraph" }] },
              ],
            })
            .command(({ tr }) => {
              // 삽입된 토글 안의 summary 위치 찾기
              const searchStart = Math.max(0, beforePos - 5);
              const searchEnd = Math.min(
                tr.doc.content.size,
                beforePos + 50,
              );
              tr.doc.nodesBetween(searchStart, searchEnd, (node, pos) => {
                if (summaryPos >= 0) return false;
                if (node.type.name === "toggleSummary") {
                  summaryPos = pos + 1; // summary 노드 내부 진입 위치
                  return false;
                }
                return undefined;
              });
              return true;
            })
            .command(({ commands }) => {
              if (summaryPos >= 0) {
                return commands.setTextSelection(summaryPos);
              }
              return true;
            })
            .run();
        },
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
          const beforePos = range.from;
          let summaryPos = -1;
          chain()
            .deleteRange(range)
            .insertContent({
              type: name,
              attrs: { open: true },
              content: [
                { type: "toggleSummary" },
                { type: "toggleBody", content: [{ type: "paragraph" }] },
              ],
            })
            .command(({ tr }) => {
              const searchStart = Math.max(0, beforePos - 5);
              const searchEnd = Math.min(
                tr.doc.content.size,
                beforePos + 50,
              );
              tr.doc.nodesBetween(searchStart, searchEnd, (node, pos) => {
                if (summaryPos >= 0) return false;
                if (node.type.name === "toggleSummary") {
                  summaryPos = pos + 1;
                  return false;
                }
                return undefined;
              });
              return true;
            })
            .command(({ commands }) => {
              if (summaryPos >= 0) {
                return commands.setTextSelection(summaryPos);
              }
              return true;
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

  addKeyboardShortcuts() {
    // 헬퍼: 현재 selection이 토글 summary 안인지 확인하고, 부모 toggle 노드 정보 반환
    const getToggleContext = (editor: import("@tiptap/core").Editor) => {
      const { state } = editor;
      const { $from, empty } = state.selection;
      if (!empty) return null;
      if ($from.parent.type.name !== "toggleSummary") return null;
      for (let d = $from.depth - 1; d >= 0; d -= 1) {
        const node = $from.node(d);
        if (node.type.name === "toggle") {
          return {
            togglePos: $from.before(d),
            toggleNode: node,
            summaryNode: $from.parent,
            isEmpty: $from.parent.content.size === 0,
            isAtStart: $from.parentOffset === 0,
          };
        }
      }
      return null;
    };

    return {
      // 빈 summary에서 Backspace → 토글 삭제
      Backspace: ({ editor }) => {
        const ctx = getToggleContext(editor);
        if (!ctx || !ctx.isEmpty || !ctx.isAtStart) return false;
        editor
          .chain()
          .focus()
          .deleteRange({
            from: ctx.togglePos,
            to: ctx.togglePos + ctx.toggleNode.nodeSize,
          })
          .run();
        return true;
      },
      // Enter: 빈 summary → 토글 삭제, 내용 있으면 본문으로 이동
      Enter: ({ editor }) => {
        const ctx = getToggleContext(editor);
        if (!ctx) return false;
        // 빈 summary → 토글 삭제 + 그 자리에 빈 paragraph
        if (ctx.isEmpty) {
          editor
            .chain()
            .focus()
            .deleteRange({
              from: ctx.togglePos,
              to: ctx.togglePos + ctx.toggleNode.nodeSize,
            })
            .insertContentAt(ctx.togglePos, { type: "paragraph" })
            .run();
          return true;
        }
        // 내용 있음 → 본문 첫 줄로 커서 이동
        // toggle 안 구조: togglePos | toggle 시작 +1 | summary | body | toggle 끝
        // body 시작 = togglePos + 1 + summaryNode.nodeSize
        // body 안 첫 paragraph 시작 = body 시작 + 1
        const bodyInsidePos = ctx.togglePos + 1 + ctx.summaryNode.nodeSize + 1;
        // 닫혀 있으면 펼치기
        const chain = editor.chain().focus();
        if (!ctx.toggleNode.attrs.open) {
          chain.updateAttributes("toggle", { open: true });
        }
        chain.setTextSelection(bodyInsidePos).run();
        return true;
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
