/**
 * 마크다운 ↔ HTML/TipTap 변환 도우미.
 *
 * tiptap-markdown은 표준 마크다운을 처리해주지만,
 * GitHub Alert(콜아웃)와 <details>(토글)는 우리가 직접 처리해야 함.
 *
 * 전략:
 *  - 저장 시: TipTap에서 받은 마크다운 결과에 콜아웃/토글 변환을 후처리
 *  - 로드 시: 사용자가 입력한 GitHub Alert/<details> 마크다운을
 *            tiptap-markdown이 이해하는 HTML로 사전 변환
 */

const ALERT_TYPES = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"] as const;
type AlertType = (typeof ALERT_TYPES)[number];

/**
 * 사용자가 작성한 markdown을 TipTap이 로드하기 전에 전처리.
 *
 *  > [!NOTE]
 *  > content
 *
 * → <div data-callout="true" data-callout-type="NOTE">...</div>
 */
export function preprocessMarkdown(markdown: string): string {
  if (!markdown) return markdown;
  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/);
    if (alertMatch) {
      const type = alertMatch[1] as AlertType;
      const inner: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].startsWith(">")) {
        inner.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      result.push(
        `<div data-callout="true" data-callout-type="${type}">`,
        ...inner,
        `</div>`,
        "",
      );
      continue;
    }
    result.push(line);
    i += 1;
  }
  return result.join("\n");
}

/**
 * TipTap이 직렬화한 markdown을 GitHub Alert 형식으로 후처리.
 *
 * (콜아웃 노드는 div로 마크업되는데, tiptap-markdown은 div를 그대로 emit하므로
 *  우리는 HTML 직렬화 결과를 받아서 markdown으로 한 번 더 변환)
 *
 * 입력은 tiptap이 출력한 markdown 문자열.
 * 콜아웃은 다음과 같은 패턴으로 나타남:
 *   <div data-callout="true" data-callout-type="NOTE">
 *
 *   content
 *
 *   </div>
 */
export function postprocessMarkdown(markdown: string): string {
  if (!markdown) return markdown;

  // 콜아웃 HTML → GitHub Alert
  const calloutRegex =
    /<div\s+data-callout="true"\s+data-callout-type="(NOTE|TIP|IMPORTANT|WARNING|CAUTION)"\s*>([\s\S]*?)<\/div>/g;
  return markdown.replace(calloutRegex, (_match, type: string, inner: string) => {
    const content = inner.trim();
    const prefixed = content
      .split("\n")
      .map((line) => (line.length ? `> ${line}` : ">"))
      .join("\n");
    return `> [!${type}]\n${prefixed}`;
  });
}
