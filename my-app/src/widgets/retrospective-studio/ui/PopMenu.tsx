import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface PopMenuProps {
  /** 버튼 안 내용 */
  trigger: ReactNode;
  triggerClass?: string;
  triggerLabel?: string;
  triggerTitle?: string;
  side?: "l" | "r";
  /** 펼친 판 class(기본 rv-pop) */
  popClass?: string;
  role?: "menu" | "dialog";
  children: (close: () => void) => ReactNode;
}

/**
 * 시안 `.q-wrap` + `.q-pop` 메뉴. 바깥 누르기와 Esc 로 닫고(누른 버튼으로 포커스 복귀),
 * 위아래 화살표로 메뉴 항목 사이를 옮긴다.
 */
export function PopMenu({ trigger, triggerClass = "rv-bt g", triggerLabel, triggerTitle, side = "l", popClass = "rv-pop", role = "menu", children }: PopMenuProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    const first = wrap.current?.querySelector<HTMLElement>(
      ".rv-pop input, .rv-pop [role^='menuitem'][aria-checked='true'], .rv-pop [role^='menuitem'], .rv-pop button",
    );
    first?.focus();
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  // 닫을 때 누른 버튼으로 포커스를 돌린다(렌더 중 ref 를 읽지 않게 effect 에서).
  const [restore, setRestore] = useState(0);
  useEffect(() => {
    if (restore) btn.current?.focus();
  }, [restore]);
  const close = () => {
    setOpen(false);
    setRestore((n) => n + 1);
  };

  return (
    <span
      className="rv-wrap"
      ref={wrap}
      onKeyDown={(e) => {
        if (!open) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
          return;
        }
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        const items = [...(wrap.current?.querySelectorAll<HTMLElement>(".rv-pop [role^='menuitem'], .rv-pop button") ?? [])];
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }}
    >
      <button
        ref={btn}
        type="button"
        className={triggerClass}
        aria-haspopup={role}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={triggerLabel}
        title={triggerTitle}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open ? (
        <div id={id} className={`${popClass} ${side}`} role={role}>
          {children(close)}
        </div>
      ) : null}
    </span>
  );
}
