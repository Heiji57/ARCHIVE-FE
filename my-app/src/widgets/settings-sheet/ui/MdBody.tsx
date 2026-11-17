import { useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import {
  applySlash,
  findSlash,
  highlightLine,
  slashDescKey,
  slashLabelKey,
  slashQueryAt,
  type SlashQuery,
} from "../model/templateMarkdown";

/** 텍스트 칸에서 커서 위치(px). 같은 글꼴의 보이지 않는 복제 상자로 잰다. */
function caretXY(ta: HTMLTextAreaElement) {
  const m = document.createElement("div");
  const cs = getComputedStyle(ta);
  for (const k of ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingLeft", "paddingRight", "borderLeftWidth", "borderTopWidth", "boxSizing", "tabSize"] as const) {
    m.style[k] = cs[k];
  }
  Object.assign(m.style, { position: "absolute", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word", width: `${ta.clientWidth}px`, top: "0", left: "0" });
  m.textContent = ta.value.slice(0, ta.selectionStart);
  const sp = document.createElement("span");
  sp.textContent = "​";
  m.append(sp);
  document.body.append(m);
  const r = { x: sp.offsetLeft, y: sp.offsetTop + sp.offsetHeight - ta.scrollTop };
  m.remove();
  return r;
}

function Highlight({ md }: { md: string }) {
  const lines = md.split("\n");
  return (
    <>
      {lines.map((l, i) => {
        const h = highlightLine(l);
        let node: ReactNode;
        if (h.kind === "h")
          node = (
            <span className={`h${h.level}`}>
              <i>{h.mark}</i>
              {h.text}
            </span>
          );
        else if (h.kind === "m")
          node = (
            <>
              <i className="m">{h.mark}</i>
              {h.text}
            </>
          );
        else if (h.kind === "q") node = <span className="q">{h.text}</span>;
        else node = h.text;
        return (
          <span key={i}>
            {node}
            {"\n"}
          </span>
        );
      })}
    </>
  );
}

interface MdBodyProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  /** 크게 보기 안에서는 구문 강조 없이 넓은 칸 */
  plain?: boolean;
  autoFocus?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

/**
 * 템플릿 본문(시안 템플릿 작성 1번 hlBox): 같은 글꼴로 겹친 구문 강조 + 투명 글자 textarea.
 * "/" 를 치면 회고 편집기와 같은 블록 목록(화살표, Enter/Tab 으로 넣기, Esc 닫기).
 */
export function MdBody({ value, onChange, className = "", plain, autoFocus, textareaRef }: MdBodyProps) {
  const { t } = useTranslation();
  const own = useRef<HTMLTextAreaElement>(null);
  const ta = textareaRef ?? own;
  const pre = useRef<HTMLPreElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [sl, setSl] = useState<{ q: SlashQuery; i: number; x: number; y: number } | null>(null);
  const items = sl ? findSlash(sl.q.query, t) : [];

  const check = (el: HTMLTextAreaElement) => {
    const q = slashQueryAt(el.value, el.selectionStart);
    if (!q) return setSl(null);
    const xy = caretXY(el);
    const hr = host.current?.getBoundingClientRect();
    const tr = el.getBoundingClientRect();
    const left = hr ? Math.max(8, Math.min(tr.left - hr.left + xy.x, hr.width - 308)) : xy.x;
    const top = hr ? tr.top - hr.top + xy.y + 4 : xy.y;
    setSl((cur) => ({ q, i: cur && cur.q.query === q.query ? cur.i : 0, x: left, y: top }));
  };
  const pick = (id: string) => {
    const el = ta.current;
    if (!el || !sl) return;
    const r = applySlash(el.value, sl.q, el.selectionStart, id);
    setSl(null);
    onChange(r.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.caret, r.caret);
    });
  };

  let n = -1;
  const groups = (["basic", "list", "block"] as const)
    .map((g) => [g, items.filter((x) => x.group === g)] as const)
    .filter(([, it]) => it.length);

  return (
    <div ref={host} className={`sxt-md one${plain ? "" : " sxt-hl"} ${className}`.trim()}>
      {plain ? null : (
        <pre ref={pre} className="sxt-hlp" aria-hidden="true">
          <Highlight md={value} />
          {"\n"}
        </pre>
      )}
      <label className="sxt-in2">
        <span className="sx-sr">{t("settingsSheet.ed.body")}</span>
        <textarea
          ref={ta}
          className={`sxt-ta${plain ? "" : " hl"}`}
          value={value}
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={t("settingsSheet.ed.bodyPh")}
          aria-describedby="sxt-hint"
          onChange={(e) => {
            onChange(e.target.value);
            check(e.target);
          }}
          onScroll={(e) => {
            if (pre.current) pre.current.scrollTop = e.currentTarget.scrollTop;
          }}
          onBlur={() => window.setTimeout(() => setSl(null), 120)}
          onKeyDown={(e) => {
            if (!sl) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const len = Math.max(1, items.length);
              setSl({ ...sl, i: (sl.i + (e.key === "ArrowDown" ? 1 : -1) + len) % len });
            } else if ((e.key === "Enter" || e.key === "Tab") && items.length && !e.nativeEvent.isComposing) {
              e.preventDefault();
              pick(items[Math.min(sl.i, items.length - 1)].id);
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setSl(null);
            }
          }}
        />
      </label>
      {sl ? (
        <div className="sxt-sl" role="listbox" aria-label={t("settingsSheet.ed.slash")} style={{ left: sl.x, top: sl.y }}>
          {groups.length ? (
            groups.map(([g, it]) => (
              <div className="sxt-slg" key={g}>
                <p>{t(`settingsSheet.slash.g.${g}`)}</p>
                {it.map((x) => {
                  n += 1;
                  const sel = n === Math.min(sl.i, items.length - 1);
                  return (
                    <button
                      key={x.id}
                      type="button"
                      role="option"
                      aria-selected={sel}
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(x.id);
                      }}
                    >
                      <span className="ic">{x.icon}</span>
                      <span>
                        <b>{t(slashLabelKey(x.id))}</b>
                        <small>{t(slashDescKey(x.id))}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <p className="sxt-sle">{t("settingsSheet.ed.slashNone")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
