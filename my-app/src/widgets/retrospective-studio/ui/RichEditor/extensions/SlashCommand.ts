import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

/**
 * 빈 Extension. 슬래시 명령 로직은 RichEditor가 editor.on/document keydown 으로 처리.
 */
export const SlashCommandExtension = Extension.create({
  name: "slashCommand",
});

/**
 * 커서 직전 텍스트에서 `/<query>` 패턴 추출.
 */
export function detectSlashQuery(editor: Editor): {
  active: boolean;
  query: string;
  from: number;
  to: number;
} {
  const { state } = editor;
  const { selection } = state;
  const { from } = selection;

  const start = Math.max(0, from - 32);
  const textBefore = state.doc.textBetween(start, from, "\n", "\n");
  const match = textBefore.match(/(^|\s)\/([^\s/]*)$/);
  if (!match) {
    return { active: false, query: "", from: 0, to: 0 };
  }
  const slashOffset = match.index! + match[1].length;
  const slashFrom = start + slashOffset;
  return {
    active: true,
    query: match[2],
    from: slashFrom,
    to: from,
  };
}
