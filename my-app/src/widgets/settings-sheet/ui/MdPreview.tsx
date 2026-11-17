import type { ReactNode } from "react";
import { useTranslation } from "@/shared/lib/i18n";

/** 아주 작은 마크다운 보기(시안 mdHTML): 제목, 목록, 할 일, 인용, 콜아웃, 구분선, 코드, 문단. HTML 문자열 없이 React 로. */

function inline(s: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(m[1] != null ? <b key={`${key}-${i++}`}>{m[1]}</b> : <code key={`${key}-${i++}`}>{m[2]}</code>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out.length ? out : [" "];
}

export function MdPreview({ md }: { md: string }) {
  const { t } = useTranslation();
  const out: ReactNode[] = [];
  let list: { kind: "ul" | "ol" | "td"; items: ReactNode[] } | null = null;
  let code: string[] | null = null;
  const flush = () => {
    if (!list) return;
    const k = `l${out.length}`;
    out.push(
      list.kind === "ol" ? (
        <ol key={k}>{list.items}</ol>
      ) : (
        <ul key={k} className={list.kind === "td" ? "td" : undefined}>
          {list.items}
        </ul>
      ),
    );
    list = null;
  };
  const push = (kind: "ul" | "ol" | "td", node: ReactNode) => {
    if (!list || list.kind !== kind) {
      flush();
      list = { kind, items: [] };
    }
    list.items.push(node);
  };
  md.split("\n").forEach((l, i) => {
    const k = `n${i}`;
    let m: RegExpMatchArray | null;
    if (code) {
      if (/^```/.test(l)) {
        out.push(
          <pre key={k}>
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      } else code.push(l);
      return;
    }
    if (/^```/.test(l)) {
      flush();
      code = [];
    } else if ((m = l.match(/^(#{1,3})\s+(.*)$/))) {
      flush();
      const H = `h${m[1].length + 1}` as "h2" | "h3" | "h4";
      out.push(<H key={k}>{inline(m[2], k)}</H>);
    } else if (/^(---|\*\*\*)\s*$/.test(l)) {
      flush();
      out.push(<hr key={k} />);
    } else if ((m = l.match(/^>\s?\[!(\w+)\]\s?(.*)$/))) {
      flush();
      out.push(
        <div key={k} className="co">
          <b>{m[1]}</b>
          {inline(m[2], k)}
        </div>,
      );
    } else if ((m = l.match(/^\s*[-*]\s+\[( |x)\]\s*(.*)$/i))) {
      push(
        "td",
        <li key={k}>
          <span className={`cb${m[1] === " " ? "" : " on"}`} aria-hidden="true" />
          {inline(m[2], k)}
        </li>,
      );
    } else if ((m = l.match(/^\s*[-*]\s+(.*)$/))) {
      push("ul", <li key={k}>{inline(m[1], k)}</li>);
    } else if ((m = l.match(/^\s*\d+\.\s+(.*)$/))) {
      push("ol", <li key={k}>{inline(m[1], k)}</li>);
    } else if ((m = l.match(/^>\s?(.*)$/))) {
      flush();
      out.push(<blockquote key={k}>{inline(m[1], k)}</blockquote>);
    } else if (!l.trim()) {
      flush();
    } else {
      flush();
      out.push(<p key={k}>{inline(l, k)}</p>);
    }
  });
  if (code) out.push(<pre key="code-end"><code>{(code as string[]).join("\n")}</code></pre>);
  flush();
  return (
    <div className="sxt-out" aria-label={t("settingsSheet.ed.preview")}>
      {out.length ? out : <p className="sx-mu">{t("settingsSheet.ed.previewEmpty")}</p>}
    </div>
  );
}
