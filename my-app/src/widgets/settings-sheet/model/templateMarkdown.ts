import type { TranslationKey } from "@/shared/lib/i18n";

/** 회고 템플릿 본문(마크다운) 도우미: 항목 제목, 줄 강조, / 명령. */

export function headingsOf(md: string): string[] {
  return md
    .split("\n")
    .filter((l) => /^#{1,3}\s+\S/.test(l))
    .map((l) => l.replace(/^#{1,3}\s+/, "").trim());
}

export function isBlankTemplate(md: string): boolean {
  return !md.replace(/#/g, "").trim();
}

export type HighlightedLine =
  | { kind: "h"; level: number; mark: string; text: string }
  | { kind: "m"; mark: string; text: string }
  | { kind: "q"; text: string }
  | { kind: "t"; text: string };

/** 시안 3번 구문 강조: 같은 글꼴, 색만 다르게. */
export function highlightLine(l: string): HighlightedLine {
  let m: RegExpMatchArray | null;
  if ((m = l.match(/^(#{1,3})(\s.*)?$/))) return { kind: "h", level: m[1].length, mark: m[1], text: m[2] ?? "" };
  if ((m = l.match(/^(\s*[-*]\s+\[[ xX]\])(.*)$/))) return { kind: "m", mark: m[1], text: m[2] };
  if ((m = l.match(/^(\s*(?:[-*]|\d+\.)\s)(.*)$/))) return { kind: "m", mark: m[1], text: m[2] };
  if (/^(>|---|```|\|)/.test(l)) return { kind: "q", text: l };
  return { kind: "t", text: l };
}

export interface SlashItem {
  id: string;
  group: "basic" | "list" | "block";
  /** 아이콘 칸 글자 */
  icon: string;
  insert: string;
  /** 찾기 낱말(화면에 보이지 않음) */
  kw: string;
}

/** 회고 편집기(리치 에디터)와 같은 블록 목록. */
export const SLASH_ITEMS: readonly SlashItem[] = [
  { id: "h1", group: "basic", icon: "H1", insert: "# ", kw: "heading 제목 h1" },
  { id: "h2", group: "basic", icon: "H2", insert: "## ", kw: "heading 제목 h2" },
  { id: "h3", group: "basic", icon: "H3", insert: "### ", kw: "heading 제목 h3" },
  { id: "bullet", group: "list", icon: "•", insert: "- ", kw: "bullet list 목록 글머리" },
  { id: "task", group: "list", icon: "☐", insert: "- [ ] ", kw: "todo task 할일 체크" },
  { id: "numbered", group: "list", icon: "1.", insert: "1. ", kw: "number 번호 순서" },
  { id: "quote", group: "block", icon: "❝", insert: "> ", kw: "quote 인용" },
  { id: "callout", group: "block", icon: "!", insert: "> [!NOTE] ", kw: "callout 콜아웃 강조 경고 팁" },
  { id: "code", group: "block", icon: "{}", insert: "```\n\n```\n", kw: "code 코드" },
  { id: "divider", group: "block", icon: "—", insert: "---\n", kw: "divider 구분선 줄" },
];

export const slashLabelKey = (id: string) => `settingsSheet.slash.${id}.t` as TranslationKey;
export const slashDescKey = (id: string) => `settingsSheet.slash.${id}.d` as TranslationKey;

export function findSlash(q: string, t: (k: TranslationKey) => string): SlashItem[] {
  const n = q.toLowerCase().replace(/\s+/g, "");
  if (!n) return [...SLASH_ITEMS];
  return SLASH_ITEMS.filter((x) =>
    [x.id, t(slashLabelKey(x.id)), x.kw].join(" ").toLowerCase().replace(/\s+/g, "").includes(n),
  );
}

export interface SlashQuery {
  query: string;
  /** "/" 의 위치 */
  start: number;
  /** "/" 앞이 줄 맨 앞(공백만)인지 */
  lineStart: boolean;
}

/** 커서 바로 앞이 "/검색어"(줄 맨 앞이나 공백 뒤)인지. */
export function slashQueryAt(value: string, caret: number): SlashQuery | null {
  const before = value.slice(0, caret);
  const line = before.slice(before.lastIndexOf("\n") + 1);
  const m = line.match(/(^|\s)\/([^\s/]*)$/);
  if (!m) return null;
  const start = caret - m[2].length - 1;
  const lineStart = !line.slice(0, line.length - m[2].length - 1).trim();
  return { query: m[2], start, lineStart };
}

/** "/검색어"를 블록 표시로 바꾼다. 줄 중간이면 새 줄에 넣는다. */
export function applySlash(value: string, q: SlashQuery, caret: number, id: string): { value: string; caret: number } {
  const item = SLASH_ITEMS.find((x) => x.id === id);
  if (!item) return { value, caret };
  const ins = (q.lineStart ? "" : "\n") + item.insert;
  const next = value.slice(0, q.start) + ins + value.slice(caret);
  let pos = q.start + ins.length;
  if (id === "code") pos = q.start + ins.indexOf("\n") + 1;
  return { value: next, caret: pos };
}
