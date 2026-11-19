export interface RetroDraftLabels {
  done: string;
  commits: string;
  none: string;
  carried(n: number): string;
  /** 끝냄으로 바꾼 일(0개면 쓰지 않음). 앞의 쉼표까지 포함. */
  closed(n: number): string;
  learned: string;
}

/**
 * 하루 닫기 회고 초안(시안 carry3.js finish). 일일 회고 본문(마크다운)으로 저장한다.
 */
export function retroDraft(p: {
  title: string;
  done: string[];
  commits: Array<{ message: string; repo: string }>;
  carried: number;
  closed: number;
  labels: RetroDraftLabels;
}): string {
  const L = p.labels;
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`) : [`- ${L.none}`]);
  return [
    `## ${p.title}`,
    "",
    L.done,
    ...list(p.done),
    "",
    L.commits,
    ...list(p.commits.map((c) => `${c.message} (${c.repo})`)),
    "",
    `${L.carried(p.carried)}${p.closed ? L.closed(p.closed) : ""}`,
    "",
    L.learned,
  ].join("\n");
}
