import { mergeAttributes, Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: () => ReturnType;
    };
  }
}

/**
 * 토글 노드 — <details>로 직렬화.
 *
 * 단순화 버전: 단일 노드. 첫 번째 자식이 summary 역할,
 * 나머지가 본문이 됨. 별도의 토글 summary/body 서브 노드 없이
 * 표준 block 콘텐츠를 사용해 ProseMirror 스키마 충돌 회피.
 */
export const ToggleNode = Node.create({
  name: "toggle",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      summary: {
        default: "토글 제목",
        parseHTML: (element) => {
          const summary = element.querySelector(":scope > summary");
          return summary?.textContent ?? "토글 제목";
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "details" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, { class: "rich-toggle" }),
      [
        "summary",
        { class: "rich-toggle-summary", contenteditable: "false" },
        node.attrs.summary,
      ],
      ["div", { class: "rich-toggle-body" }, 0],
    ];
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { summary: "토글 제목" },
              content: [{ type: "paragraph" }],
            })
            .run(),
    };
  },
});
