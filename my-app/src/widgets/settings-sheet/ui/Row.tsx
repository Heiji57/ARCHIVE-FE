import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { ICON_STROKE } from "@/shared/ui/icons";

/** 시안 settings.css 의 묶음과 줄: sx-card, sx-row, sx-more(접힌 줄), sx-blk(블록), sx-sub(작은 제목). */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`sx-card ${className}`}>{children}</div>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <h3 className="sx-sub">{children}</h3>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="sx-note">{children}</p>;
}

interface RowProps {
  id: string;
  title: ReactNode;
  desc?: ReactNode;
  /** 손잡이를 아래 줄에 넓게 */
  wide?: boolean;
  children: ReactNode;
}

/** 바로 보이는 줄: 왼쪽 이름과 설명, 오른쪽(넓으면 아래) 손잡이. */
export function Row({ id, title, desc, wide, children }: RowProps) {
  return (
    <div className={`sx-row${wide ? " w" : ""}`} id={`sx-r-${id}`}>
      <div className="sx-l">
        <b>{title}</b>
        {desc ? <p>{desc}</p> : null}
      </div>
      <div className="sx-c">{children}</div>
    </div>
  );
}

interface MoreRowProps extends Omit<RowProps, "wide"> {
  /** 접혀 있을 때 오른쪽에 보이는 지금 값 */
  summary?: ReactNode;
  danger?: boolean;
  /** 찾기 결과처럼 처음부터 펼친다 */
  defaultOpen?: boolean;
}

/** 필요할 때만 펼치는 줄(세부 설정). 접혀 있으면 지금 값만 한 줄로. */
export function MoreRow({ id, title, desc, summary, danger, defaultOpen = false, children }: MoreRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `sx-b-${id}`;
  return (
    <div className={`sx-row sx-more${danger ? " sx-dz" : ""}${open ? " open" : ""}`} id={`sx-r-${id}`}>
      <button type="button" className="sx-mh" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)}>
        <span className="sx-l">
          <b>{title}</b>
          {desc && !open ? <p>{desc}</p> : null}
        </span>
        {summary != null && summary !== "" && !open ? <span className="sx-sum">{summary}</span> : <span />}
        <ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      {open ? (
        <div className="sx-mb" id={bodyId}>
          {desc ? <p className="sx-md">{desc}</p> : null}
          <div className="sx-c">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

interface BlockProps {
  id: string;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

/** 묶음 블록(할 일과 캘린더, 회고, 데이터): 제목과 설명, 오른쪽 위 동작 하나. */
export function Block({ id, title, desc, action, children }: BlockProps) {
  return (
    <section className="sx-blk" id={`sx-r-${id}`} aria-labelledby={`sx-h-${id}`}>
      <header>
        <div>
          <h3 id={`sx-h-${id}`}>{title}</h3>
          {desc ? <p>{desc}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** 목록 한 줄(sx-list li): 앞 아이콘, 이름과 작은 설명, 오른쪽 손잡이. */
export function ListLine({ icon, title, desc, children }: { icon?: ReactNode; title: ReactNode; desc?: ReactNode; children?: ReactNode }) {
  return (
    <li>
      <span className="sx-li">
        {icon}
        <span>
          <b>{title}</b>
          {desc ? <small>{desc}</small> : null}
        </span>
      </span>
      {children}
    </li>
  );
}
