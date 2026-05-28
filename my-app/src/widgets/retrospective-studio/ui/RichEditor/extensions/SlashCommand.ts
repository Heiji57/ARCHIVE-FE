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
 *
 * 중요: textBetween을 doc 전체에 호출하면 블록 경계가 separator로 대체되어
 * 텍스트 인덱스와 ProseMirror position이 어긋남. 같은 블록 안에서만 검사해
 * 1:1 매핑을 보장해야 함.
 */
export function detectSlashQuery(editor: Editor): {
  active: boolean;
  query: string;
  from: number;
  to: number;
} {
  const { state } = editor;
  const { $from } = state.selection;
  const cursorPos = $from.pos;

  // 현재 커서가 속한 textblock의 시작 위치
  const blockStart = $from.start($from.depth);

  // 같은 블록 내부 텍스트만 추출 → 인덱스 == (position - blockStart)
  const textBefore = state.doc.textBetween(blockStart, cursorPos, "", "");
  const match = textBefore.match(/(^|\s)\/([^\s/]*)$/);
  if (!match) {
    return { active: false, query: "", from: 0, to: 0 };
  }
  const slashOffset = match.index! + match[1].length;
  const slashFrom = blockStart + slashOffset;
  return {
    active: true,
    query: match[2],
    from: slashFrom,
    to: cursorPos,
  };
}
