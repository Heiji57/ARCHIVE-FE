import type { ChainedCommands } from "@tiptap/core";

/* ============================================================
   Notion 스타일 토글 — 3개 노드:
     toggle: 부모 컨테이너 (open 속성 보유)
       ├── toggleSummary: 편집 가능한 제목 (inline)
       └── toggleBody:    편집 가능한 본문 (block+)
   ============================================================ */

export const TOGGLE_NAME = "toggle";

/** 새 토글 노드의 기본 콘텐츠 (열린 상태 + 빈 제목/본문) */
export function buildToggleContent() {
  return {
    type: TOGGLE_NAME,
    attrs: { open: true },
    content: [
      { type: "toggleSummary" },
      { type: "toggleBody", content: [{ type: "paragraph" }] },
    ],
  };
}

/**
 * chain에 "토글 삽입 + 제목(summary)으로 커서 이동" 스텝을 추가한다.
 *  - beforePos 주변에서 toggleSummary 위치를 찾아 selection 이동
 *  - setToggle 커맨드와 `>>` 입력 룰이 공유하는 로직
 */
export function appendToggleInsertion(
  chain: ChainedCommands,
  beforePos: number,
): ChainedCommands {
  // 두 command 콜백이 순차 실행되며 공유하는 summary 위치
  const ref = { summaryPos: -1 };
  return chain
    .insertContent(buildToggleContent())
    .command(({ tr }) => {
      const searchStart = Math.max(0, beforePos - 5);
      const searchEnd = Math.min(tr.doc.content.size, beforePos + 50);
      tr.doc.nodesBetween(searchStart, searchEnd, (node, pos) => {
        if (ref.summaryPos >= 0) return false;
        if (node.type.name === "toggleSummary") {
          ref.summaryPos = pos + 1; // summary 노드 내부 진입 위치
          return false;
        }
        return undefined;
      });
      return true;
    })
    .command(({ commands }) => {
      if (ref.summaryPos >= 0) {
        return commands.setTextSelection(ref.summaryPos);
      }
      return true;
    });
}
