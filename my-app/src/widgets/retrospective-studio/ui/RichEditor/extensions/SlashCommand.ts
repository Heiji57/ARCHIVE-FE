import { Extension, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { Editor } from "@tiptap/core";
import { filterCommands, type SlashCommandItem } from "../commands";

export interface SlashCommandProps {
  /** 메뉴 렌더링 후 반환되는 컨트롤러 */
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
 * `/` 슬래시 커맨드 — @tiptap/suggestion 기반.
 * 필터링은 commands.ts의 filterCommands가 담당.
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

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommandItem }) => {
          props.execute(editor, range);
        },
        items: ({ query }: { query: string }) => filterCommands(query),
        render: this.options.render as unknown as SuggestionOptions["render"],
      }),
    ];
  },
});
