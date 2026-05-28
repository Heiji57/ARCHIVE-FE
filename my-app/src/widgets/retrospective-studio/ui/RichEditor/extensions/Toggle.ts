import { InputRule, mergeAttributes, Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: () => ReturnType;
    };
  }
}

/**
 * 토글 노드 — <details>로 직렬화. 단일 노드, summary는 속성.
 *
 * Input rule: `>>` + 공백 → 토글 변환
 *  (`>` 는 인용/blockquote와 충돌하므로 `>>`로)
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

  // InputRule: `>>` + 공백 → 토글
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
              attrs: { summary: "토글 제목" },
              content: [{ type: "paragraph" }],
            })
            .run();
        },
      }),
    ];
  },
});
