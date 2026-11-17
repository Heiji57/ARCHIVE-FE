/** 주제 화면 공통 조각: 시안 아이콘(ic.topic, KI.*, ICD/ICG, CHV, ic.gh)과 짧은 markdown 그리기. */
import { Fragment, type ReactNode } from "react";
import type { TaskStatus } from "@/entities/todo/model/types";

type P = { className?: string };

/** 시안 ic.topic(책갈피 모양 주제 표시) */
export const TopicGlyph = ({ className = "ico" }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 4h14v16l-7-4-7 4z" />
  </svg>
);

/** 문서 보기(ICD) */
export const DocGlyph = () => (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M9 11h6M9 15h6" />
  </svg>
);

/** 연결 보기(ICG) */
export const GraphGlyph = () => (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="6" cy="7" r="2" />
    <circle cx="18" cy="6.5" r="2" />
    <circle cx="12" cy="17.5" r="2.4" />
    <path d="m7 8.8 4 6.6M17 8.4l-4 7M8 7l8-.4" />
  </svg>
);

/** 접기 화살표(CHV) */
export const Chevron = () => (
  <svg className="ico chv" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** 시안 ic.gh(커밋 모양) */
export const CommitGlyph = () => (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3.5" />
    <path d="M3 12h5.5M15.5 12H21" />
  </svg>
);

/** 근거 종류 아이콘(근거 구분 3번): 회고 펜, 끝냄 체크, 하는 중 화살표, 아직 줄표 */
export function KindIcon({ kind }: { kind: "r" | "done" | "doing" | "open" }) {
  return (
    <svg className="ki" viewBox="0 0 16 16" aria-hidden="true">
      {kind === "r" ? (
        <path className="f" d="M2 14l.9-3.6L10.6 2.7a1.4 1.4 0 0 1 2 0l.7.7a1.4 1.4 0 0 1 0 2l-7.7 7.7z" />
      ) : kind === "done" ? (
        <path className="s" d="m2.5 8.6 3.6 3.6L13.5 4.6" />
      ) : kind === "doing" ? (
        <path className="s" d="M2.5 8h9M8.5 4.2 12.3 8l-3.8 3.8" />
      ) : (
        <path className="s" d="M3.5 8h9" />
      )}
    </svg>
  );
}

/** 시안 ckIcon: 할 일 상태 동그라미 */
export function CheckDot({ status }: { status: TaskStatus }) {
  if (status === "done")
    return (
      <span className="q-ck">
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </span>
    );
  return <span className={`q-ck ${status === "in-progress" ? "d" : "o"}`} />;
}

/** `코드` 만 따로 그린 한 줄 */
function inline(s: string): ReactNode {
  const parts = s.split(/(`[^`]+`)/g);
  return parts.map((p, i) =>
    p.startsWith("`") && p.endsWith("`") && p.length > 1 ? <code key={i}>{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>,
  );
}

/** 회고 원문(## 제목, - 목록, 문단, `코드`)을 그린다. HTML 을 넣지 않는다. */
export function MiniMarkdown({ source, className }: { source: string; className?: string }) {
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    out.push(
      <ul key={`u${out.length}`}>
        {items.map((x, i) => (
          <li key={i}>{inline(x)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const raw of source.split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("- ")) {
      list.push(l.slice(2));
      continue;
    }
    flush();
    if (l.startsWith("## ")) out.push(<h2 key={`h${out.length}`}>{inline(l.slice(3))}</h2>);
    else out.push(<p key={`p${out.length}`}>{inline(l)}</p>);
  }
  flush();
  return <div className={className}>{out}</div>;
}
