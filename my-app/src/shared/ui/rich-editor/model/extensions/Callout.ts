import { mergeAttributes, Node } from "@tiptap/core";
import type { CalloutType } from "../types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
      setCalloutType: (type: CalloutType) => ReturnType;
    };
  }
}

/**
 * 콜아웃 — GitHub Alert 호환 (5종).
 * defining/isolating 제거하여 schema 안정성 우선.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      type: {
        default: "NOTE" as CalloutType,
        parseHTML: (element) =>
          (element.getAttribute("data-callout-type") as CalloutType) ?? "NOTE",
        renderHTML: (attrs) => ({ "data-callout-type": attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "true",
        class: "rich-callout",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { type: attrs?.type ?? "NOTE" },
              content: [{ type: "paragraph" }],
            })
            .run(),
      setCalloutType:
        (type) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { type }),
    };
  },
});
