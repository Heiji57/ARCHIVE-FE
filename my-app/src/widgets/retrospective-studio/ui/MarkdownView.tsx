import { useMemo } from "react";
import { markdownToHtml } from "@/shared/ui/rich-editor";

const DROP = "script,style,iframe,object,embed,link,meta,form,input,button,textarea,select";

/** marked 결과에서 실행되는 것(스크립트, on* 속성, javascript: 링크)을 걷어낸다. */
function sanitize(html: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(DROP).forEach((n) => n.remove());
  doc.body.querySelectorAll("*").forEach((el) => {
    for (const a of [...el.attributes]) {
      const v = a.value.trim().toLowerCase();
      if (a.name.startsWith("on") || ((a.name === "href" || a.name === "src") && (v.startsWith("javascript:") || v.startsWith("data:")))) {
        el.removeAttribute(a.name);
      }
    }
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });
  return doc.body.innerHTML;
}

/** 읽기 전용 마크다운(넘기기 카드 본문). */
export function MarkdownView({ markdown, className }: { markdown: string; className?: string }) {
  const html = useMemo(() => sanitize(markdownToHtml(markdown)), [markdown]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
