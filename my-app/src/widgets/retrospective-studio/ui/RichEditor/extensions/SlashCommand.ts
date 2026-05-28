import { Extension, type Range } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { SlashCommandItem } from "../commands";

export interface SlashCommandProps {
  render: () => {
    onStart: (props: SuggestionRenderProps) => void;
    onUpdate: (props: SuggestionRenderProps) => void;
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
    onExit: () => void;
  };
}

export interface SuggestionRenderProps {
  editor: Editor;
  range: Range;
  query: string;
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  clientRect: (() => DOMRect | null) | null;
}

/**
 * 진단용 스텁 — Suggestion plugin 없이 빈 Extension.
 * 이 버전에서 cached 에러가 사라지면 Suggestion이 원인.
 */
export const SlashCommandExtension = Extension.create<SlashCommandProps>({
  name: "slashCommand",

  addOptions() {
    return {
      render: () => ({
        onStart: () => {},
        onUpdate: () => {},
        onKeyDown: () => false,
        onExit: () => {},
      }),
    };
  },
});
