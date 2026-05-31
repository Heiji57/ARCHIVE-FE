import { Node } from "@tiptap/core";

/**
 * 토글 본문 노드 (block+). 펼쳤을 때 보이는 자식 콘텐츠 영역.
 */
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
