import { mergeAttributes, Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: () => ReturnType;
    };
  }
}

/**
 * 토글 노드 — <details>/<summary> 호환.
 * 첫 번째 자식 노드는 summary로 취급, 나머지는 내용.
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

  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, { class: "rich-toggle" }),
      0,
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
              content: [
                {
                  type: "toggleSummary",
                  content: [{ type: "text", text: "토글 제목" }],
                },
                {
                  type: "toggleBody",
                  content: [{ type: "paragraph" }],
                },
              ],
            })
            .run(),
    };
  },
});

export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "summary" }];
  },
  renderHTML() {
    return ["summary", { class: "rich-toggle-summary" }, 0];
  },
});

export const ToggleBody = Node.create({
  name: "toggleBody",
  content: "block+",
  defining: true,
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
