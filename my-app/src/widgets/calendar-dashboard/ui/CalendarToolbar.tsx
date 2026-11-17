import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { fmtYearMonth, formatKey } from "../model/dateFormat";
import { useCalendarViewport, type CalendarController, type CalendarView } from "../model/useCalendarController";

const VIEWS: Array<{ v: CalendarView; key: TranslationKey }> = [
  { v: "day", key: "cal.view.day" },
  { v: "week", key: "cal.view.week" },
  { v: "month", key: "cal.view.month" },
];

/** 상단 왼쪽(시안 오늘 0번, 보기 고르기 3번 메뉴): 오늘, 보이는 달 제목, 일간·주간·월간 메뉴. */
export function CalendarToolbar({ ctl }: { ctl: CalendarController }) {
  const { t, locale } = useTranslation();
  const vp = useCalendarViewport();
  const anchor = vp.anchor ?? ctl.date;
  const title =
    ctl.view === "day"
      ? formatKey(locale, anchor, { year: "numeric", month: "long", day: "numeric" })
      : fmtYearMonth(locale, anchor);
  return (
    <>
      <button type="button" className="sh-btn" onClick={ctl.goToday} title={t("cal.todayTitle")} data-dir={vp.todayDir}>
        {t("cal.today")}
      </button>
      <h1 className="sh-title cal-ttl">{title}</h1>
      <ViewMenu ctl={ctl} />
    </>
  );
}

function ViewMenu({ ctl }: { ctl: CalendarController }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const cur = VIEWS.find((x) => x.v === ctl.view)!;

  const show = () => {
    const r = btn.current!.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 4 });
    setOpen(true);
  };
  const close = (focus = true) => {
    setOpen(false);
    if (focus) btn.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const away = (e: PointerEvent) => {
      if (menu.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? 1 : -1;
      items[(i + d + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="cal-vwb"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("cal.view.label")}: ${t(cur.key)}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            show();
          }
        }}
      >
        {t(cur.key)}
        <ChevronDown size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menu}
              className="cal-vwm"
              role="menu"
              aria-label={t("cal.view.label")}
              style={{ left: pos.left, top: pos.top }}
              onKeyDown={onMenuKey}
            >
              {VIEWS.map((x) => (
                <button
                  key={x.v}
                  type="button"
                  role="menuitemradio"
                  aria-checked={ctl.view === x.v}
                  onClick={() => {
                    ctl.setView(x.v);
                    close();
                  }}
                >
                  <span>{t(x.key)}</span>
                  {ctl.view === x.v ? <Check size={12} strokeWidth={2} aria-hidden="true" /> : null}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
