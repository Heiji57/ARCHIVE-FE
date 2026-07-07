export interface MarkdownHeading {
  level: number;
  text: string;
}

/**
 * 마크다운 원문에서 ATX 헤딩(#~######)만 순서대로 뽑는다. 코드펜스(```) 안의
 * '#'은 헤딩이 아니므로 건너뛴다. 확장(Notion 스타일) 목차 패널용 — 렌더된
 * RichEditor DOM 의 h1~h6 요소도 같은 순서로 나오므로 인덱스로 매칭해 스크롤한다.
 */
export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  let inFence = false;
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+)$/.exec(line);
    if (m) {
      const text = m[2].trim();
      if (text) headings.push({ level: m[1].length, text });
    }
  }
  return headings;
}
