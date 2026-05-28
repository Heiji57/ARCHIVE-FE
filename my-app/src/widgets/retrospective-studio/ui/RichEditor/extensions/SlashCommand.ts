import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

/**
 * 슬래시 커맨드 — Plugin / Suggestion 의존성 없는 단순 구현.
 *
 * 동작 원리:
 *   1. `/` 입력은 그냥 ProseMirror가 그대로 처리 (글자로 들어감)
 *   2. RichEditor가 editor.on("transaction") + on("selectionUpdate")를 구독
 *   3. 커서 직전 문자열에서 `/<query>` 패턴 매칭
 *   4. 매칭되면 popup 표시, 아니면 닫기
 *
 * 즉, 이 Extension은 키바인딩만 처리 (Esc로 popup 닫기 도움)
 * 나머지는 RichEditor가 함.
 */

export interface SlashCommandOptions {
  onEscape: () => boolean;
  onArrowDown: () => boolean;
  onArrowUp: () => boolean;
  onEnter: () => boolean;
}

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      onEscape: () => false,
      onArrowDown: () => false,
      onArrowUp: () => false,
      onEnter: () => false,
    };
  },

  addKeyboardShortcuts() {
    return {
      Escape: () => this.options.onEscape(),
      ArrowDown: () => this.options.onArrowDown(),
      ArrowUp: () => this.options.onArrowUp(),
      Enter: () => this.options.onEnter(),
    };
  },
});

/**
 * 커서 직전 텍스트에서 `/<query>` 패턴 추출.
 * 공백/줄바꿈 이전까지의 슬래시 문자열을 반환.
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

  // 현재 위치에서 뒤로 32자까지 확인 (긴 쿼리는 거의 없음)
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
