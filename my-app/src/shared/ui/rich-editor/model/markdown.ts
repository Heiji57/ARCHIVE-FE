import { marked } from "marked";
import TurndownService from "turndown";

/**
 * 마크다운 ↔ HTML 변환.
 * TipTap은 내부적으로 HTML을 사용하고, 우리는 entry.content에 마크다운으로 저장.
 */

type AlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

// Marked: GFM 기본, 줄바꿈 1줄로 처리
marked.setOptions({ gfm: true, breaks: true });

// ─── markdown → HTML ────────────────────────────────────────────────────────

/**
 * 사용자 마크다운을 HTML로 변환하여 TipTap에 로드.
 *  - GitHub Alert(`> [!TYPE]`) → <div data-callout> 변환
 *  - <details>는 그대로 통과
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  // GitHub Alert를 우리의 callout div로 사전 변환
  const preprocessed = convertAlertsToHtml(markdown);
  return marked.parse(preprocessed, { async: false }) as string;
}

function convertAlertsToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/);
    if (match) {
      const type = match[1] as AlertType;
      const innerLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].startsWith(">")) {
        innerLines.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      // 콜아웃 내부 마크다운을 HTML로 변환
      const innerHtml = marked.parse(innerLines.join("\n"), { async: false }) as string;
      out.push(
        `<div data-callout="true" data-callout-type="${type}">${innerHtml}</div>`,
      );
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join("\n");
}

// ─── HTML → markdown ────────────────────────────────────────────────────────

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

// 표 변환 룰 (GFM 표)
turndown.addRule("table", {
  filter: ["table"],
  replacement: (_content, node) => {
    const table = node as HTMLTableElement;
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return "";
    const lines: string[] = [];
    rows.forEach((row, idx) => {
      const cells = Array.from(row.querySelectorAll("th, td"));
      const cellTexts = cells.map((c) =>
        (c.textContent ?? "").trim().replace(/\|/g, "\\|") || " ",
      );
      lines.push(`| ${cellTexts.join(" | ")} |`);
      if (idx === 0) {
        lines.push(`| ${cellTexts.map(() => "---").join(" | ")} |`);
      }
    });
    return `\n\n${lines.join("\n")}\n\n`;
  },
});

// 콜아웃 변환 룰 (div[data-callout] → GitHub Alert)
turndown.addRule("callout", {
  filter: (node) =>
    node.nodeName === "DIV" &&
    (node as HTMLElement).getAttribute("data-callout") === "true",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const type = (el.getAttribute("data-callout-type") ?? "NOTE") as AlertType;
    // 내부 HTML을 별도 turndown 인스턴스로 변환
    const innerMd = turndown.turndown(el.innerHTML);
    const prefixed = innerMd
      .split("\n")
      .map((line) => (line.length ? `> ${line}` : ">"))
      .join("\n");
    return `\n\n> [!${type}]\n${prefixed}\n\n`;
  },
});

// 토글 변환 룰 (<details><summary>) — markdown에 그대로 HTML로 유지
turndown.addRule("toggle", {
  filter: (node) => node.nodeName === "DETAILS",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const summary = el.querySelector("summary");
    const summaryText = summary ? (summary.textContent ?? "").trim() : "";
    const bodyHtml = Array.from(el.children)
      .filter((c) => c.tagName !== "SUMMARY")
      .map((c) => c.outerHTML)
      .join("");
    const bodyMd = turndown.turndown(bodyHtml).trim();
    return `\n\n<details>\n<summary>${summaryText}</summary>\n\n${bodyMd}\n\n</details>\n\n`;
  },
});

export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return turndown.turndown(html).trim();
}
