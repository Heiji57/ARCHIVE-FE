import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import { topicColorStyle } from "../model/viewHelpers";
import { TopicGlyph } from "./parts";

export interface TopicHeaderProps {
  name: string;
  description: string;
  color: number;
  /** 주제 표시 뒤의 한 줄(기간, 회고 수, 할 일 수, 정리 날짜 ...) */
  meta: ReactNode[];
  /** 한 줄 요약 */
  lead?: string | null;
  onRename: (name: string) => void;
  onDescribe: (description: string) => void;
  /** 새 주제를 막 만들었으면 이름 칸에 바로 들어간다 */
  autoFocusName?: boolean;
}

/** 본문 상단 1번(시안 tvDocHead HD=1): 주제 표시와 한 줄, 이름을 주제 색으로 크게, 오른쪽 위 책갈피, 설명, 한 줄 요약 */
export function TopicHeader({ name, description, color, meta, lead, onRename, onDescribe, autoFocusName }: TopicHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="th1" style={topicColorStyle(color)}>
      <span className="tk-rib" aria-hidden="true" />
      <p className="mt">
        <TopicGlyph />
        <span>{t("topic.v.kind")}</span>
        {meta.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </p>
      <EditLine
        className="q-ttl"
        value={name}
        label={t("topic.v.name")}
        onCommit={(v) => v.trim() && onRename(v.trim())}
        autoFocus={autoFocusName}
      />
      <EditLine
        className="q-desc"
        value={description}
        label={t("topic.v.desc")}
        placeholder={t("topic.v.descPlaceholder")}
        multiline
        onCommit={(v) => onDescribe(v.trim())}
      />
      {lead ? <p className="lead">{lead}</p> : null}
    </header>
  );
}

/** 한 줄 고치기: 칸을 떠나거나 Enter 면 저장, Esc 면 되돌림 */
function EditLine({
  className,
  value,
  label,
  placeholder,
  onCommit,
  autoFocus,
  multiline,
}: {
  multiline?: boolean;
  className: string;
  value: string;
  label: string;
  placeholder?: string;
  onCommit: (v: string) => void;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!autoFocus) return;
    ref.current?.focus();
    ref.current?.select();
  }, [autoFocus]);
  const commit = () => {
    if (draft !== null && draft !== value) onCommit(draft);
    setDraft(null);
  };
  const props = {
    ref,
    className,
    value: draft ?? value,
    "aria-label": label,
    placeholder,
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value.replace(/\n/g, " ")),
    onBlur: commit,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
      }
      if (e.key === "Escape") {
        setDraft(null);
        requestAnimationFrame(() => ref.current?.blur());
      }
    },
  };
  return multiline ? <textarea rows={1} {...props} /> : <input {...props} />;
}
