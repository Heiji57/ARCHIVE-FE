import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { arrowNav, useOutside } from "./popover";

/** 시안 settings.css 손잡이: sx-tg(스위치), sx-seg, sxs(고르기), sx-b(버튼), sxa1(선택 카드), sxa2(라디오 목록). */

export function Toggle({ on, label, onChange, disabled }: { on: boolean; label: string; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className="sx-tg"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
    />
  );
}

export function Seg<V extends string>({ value, options, label, onChange }: { value: V; options: ReadonlyArray<readonly [V, string]>; label: string; onChange: (v: V) => void }) {
  return (
    <span className="sx-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </span>
  );
}

type BtnKind = "" | "p" | "danger" | "q" | "w" | "lnk" | "q dz";
export function Btn({ kind = "", className = "", children, ...rest }: { kind?: BtnKind } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`sx-b ${kind} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function IconBtn({ label, children, className = "", ...rest }: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`sx-ib ${className}`.trim()} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  desc?: string;
  icon?: ReactNode;
  /** 찾기에만 쓰는 낱말 */
  kw?: string;
}

interface SelectProps<V extends string> {
  value: V;
  options: ReadonlyArray<SelectOption<V>>;
  label: string;
  onChange: (v: V) => void;
  /** 목록이 길 때 위에 찾기 칸 */
  searchable?: boolean;
  placeholder?: string;
  /** 메뉴를 왼쪽에 붙인다(기본은 오른쪽 끝에 맞춤) */
  alignLeft?: boolean;
  disabled?: boolean;
  className?: string;
}

/** 기본 select 대신 쓰는 고르기(시안 sxs). 열면 고른 항목에 초점, 화살표로 이동, Esc 로 닫기. */
export function Select<V extends string>({ value, options, label, onChange, searchable, placeholder, alignLeft, disabled, className = "" }: SelectProps<V>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLSpanElement>(null);
  const listId = useId();
  const refs = useMemo(() => [wrap], []);
  const cur = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? options.filter((o) => `${o.label} ${o.desc ?? ""} ${o.kw ?? ""} ${o.value}`.toLowerCase().includes(n)) : options;
  }, [options, q]);

  const close = (focus = true) => {
    setOpen(false);
    setQ("");
    if (focus) btn.current?.focus();
  };
  useOutside(open, refs, () => close(false));
  useEffect(() => {
    if (!open) return;
    const m = menu.current;
    if (!m) return;
    if (searchable) m.querySelector<HTMLElement>("input")?.focus();
    else (m.querySelector<HTMLElement>('[aria-selected="true"]') ?? m.querySelector<HTMLElement>("button"))?.focus();
    m.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, searchable]);

  return (
    <span
      ref={wrap}
      className={`sxs${open ? " open" : ""} ${className}`.trim()}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={btn}
        type="button"
        className="sxs-b"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${cur?.label ?? placeholder ?? ""}`}
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {cur?.icon}
        <span className={cur ? "" : "sx-mu"}>{cur?.label ?? placeholder ?? ""}</span>
        <ChevronDown size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      {open ? (
        <span
          ref={menu}
          className={`sxa5-m sxs-m${alignLeft ? " l" : ""}`}
          role="listbox"
          id={listId}
          aria-label={label}
          onKeyDown={(e) => arrowNav(e, "input, button")}
        >
          {searchable ? (
            <label className="sxs-q">
              <Search size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
              <input
                type="search"
                value={q}
                placeholder={t("settingsSheet.select.search")}
                aria-label={t("settingsSheet.select.search")}
                autoComplete="off"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && shown[0]) {
                    e.preventDefault();
                    onChange(shown[0].value);
                    close();
                  }
                }}
              />
            </label>
          ) : null}
          {shown.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                close();
              }}
            >
              {o.icon}
              <span>
                <b>{o.label}</b>
                {o.desc ? <small>{o.desc}</small> : null}
              </span>
              {o.value === value ? <Check size={15} strokeWidth={ICON_STROKE} aria-hidden="true" /> : null}
            </button>
          ))}
          {shown.length === 0 ? <span className="sxs-none">{t("settingsSheet.select.empty")}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  desc: string;
}

/** 펼친 줄의 고르기(시안 AI 세부 1번: 선택 카드). */
export function ChoiceCards<V extends string>({ value, options, label, onChange }: { value: V; options: ReadonlyArray<ChoiceOption<V>>; label: string; onChange: (v: V) => void }) {
  return (
    <div className="sxa1" role="radiogroup" aria-label={label} style={{ ["--n" as string]: options.length }}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          <span>
            <b>{o.label}</b>
            {o.value === value ? <Check size={16} strokeWidth={ICON_STROKE} aria-hidden="true" /> : null}
          </span>
          <small>{o.desc}</small>
        </button>
      ))}
    </div>
  );
}

/** 동그라미 라디오 목록(시안 sxa2). */
export function RadioList<V extends string>({ value, options, label, onChange }: { value: V; options: ReadonlyArray<ChoiceOption<V>>; label: string; onChange: (v: V) => void }) {
  return (
    <div className="sxa2" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          <i aria-hidden="true" />
          <span>
            <b>{o.label}</b>
            <small>{o.desc}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export function TimeInput({ value, label, onChange }: { value: string; label: string; onChange: (v: string) => void }) {
  return <input className="sx-time" type="time" value={value} aria-label={label} onChange={(e) => e.target.value && onChange(e.target.value)} />;
}

interface MenuProps {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  menuClassName?: string;
}

/** ⋯ 메뉴(시안 sxl-mm, sxe-more). */
export function MoreMenu({ label, trigger, children, className = "", menuClassName = "" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLSpanElement>(null);
  const refs = useMemo(() => [wrap], []);
  useOutside(open, refs, () => setOpen(false));
  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
  }, [open]);
  return (
    <span
      ref={wrap}
      className={`sx-mm-w ${className}`.trim()}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          btn.current?.focus();
        }
      }}
      onClickCapture={(e) => {
        // 메뉴 항목을 누르면 닫는다
        if (open && menu.current?.contains(e.target as Node) && (e.target as HTMLElement).closest("button")) setOpen(false);
      }}
    >
      <button ref={btn} type="button" className="sx-ib" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen((v) => !v)}>
        {trigger}
      </button>
      {open ? (
        <span ref={menu} className={`sxa5-m sxs-m ${menuClassName}`.trim()} role="menu" aria-label={label} onKeyDown={(e) => arrowNav(e)}>
          {children}
        </span>
      ) : null}
    </span>
  );
}

export function MenuItem({ title, desc, icon, danger, disabled, onClick }: { title: string; desc?: string; icon?: ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" className={danger ? "d" : undefined} disabled={disabled} onClick={onClick}>
      {icon}
      <span>
        <b>{title}</b>
        {desc ? <small>{desc}</small> : null}
      </span>
    </button>
  );
}
