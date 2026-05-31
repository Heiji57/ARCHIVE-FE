import { Node } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

/**
 * 토글 제목 노드 (inline). 빈 제목에서의 Backspace/Enter 동작을 담당.
 */
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
    const getToggleContext = (editor: Editor) => {
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
