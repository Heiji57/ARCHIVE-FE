import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Plus, Settings, Target, X } from "lucide-react";
import { CALENDAR_COLORS, type UserCalendar } from "@/entities/calendar/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { calendarFilterActions, useCalendarFilter } from "../model/calendarFilter";
import { calendarColorVar, userCalendarActions, useUserCalendars } from "../model/userCalendars";

/**
 * 사이드바 캘린더 목록(시안 planner.js 캘린더 여러 개): 보이기/숨기기, 이것만 보기, 설정, 관리.
 * 서버에 사용자 캘린더가 없어(`userCalendars`) 기능이 켜졌을 때(데모)만 그린다.
 */
export function CalendarList({ todos }: { todos: Todo[] }) {
  const { t } = useTranslation();
  const { enabled, calendars, calendarOf } = useUserCalendars();
  const filter = useCalendarFilter();
  const [manage, setManage] = useState<string | null>(null);
  if (!enabled) return null;
  const ids = calendars.map((c) => c.id);
  const open = (n: string) => todos.filter((td) => td.status !== "done" && calendarOf(td)?.id === n).length;
  const newCal = () => setManage(userCalendarActions.add(""));

  return (
    <section aria-label={t("cal.cals.title")}>
      <h2 className="cal-sh2 hx">
        {t("cal.cals.title")}
        <button type="button" className="sh-ibtn" aria-label={t("cal.cals.new")} title={t("cal.cals.new")} onClick={newCal}>
          <Plus size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </h2>
      {calendars.map((c) => {
        const off = filter.hidden.has(c.id);
        return (
          <div key={c.id} className={`cal-cl${off ? " off" : ""}`} style={{ "--cc": calendarColorVar(c.color) } as CSSProperties}>
            <button
              type="button"
              className="cal-cl-t"
              aria-pressed={!off}
              title={t(off ? "cal.cals.show" : "cal.cals.hide")}
              onClick={() => calendarFilterActions.toggleCalendar(c.id)}
            >
              <i aria-hidden="true" />
              <span>{c.name || t("cal.cm.unnamed")}</span>
              {c.isDefault ? <em>{t("cal.cals.default")}</em> : null}
            </button>
            <span className="cal-cl-n">{open(c.id)}</span>
            <button
              type="button"
              className="cal-cl-a"
              title={t("cal.cals.onlyTitle")}
              aria-label={t("cal.cals.only", { name: c.name })}
              onClick={() => calendarFilterActions.soloCalendar(c.id, ids)}
            >
              <Target size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cal-cl-a"
              title={t("cal.cals.settingsTitle")}
              aria-label={t("cal.cals.settings", { name: c.name })}
              onClick={() => setManage(c.id)}
            >
              <Settings size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button type="button" className="cal-cl-m" onClick={() => setManage(calendars[0]?.id ?? null)}>
        {t("cal.cals.manage")}
      </button>
      {manage ? (
        <CalendarManager
          calendars={calendars}
          current={manage}
          todos={todos}
          calendarOf={calendarOf}
          onSelect={setManage}
          onNew={newCal}
          onClose={() => setManage(null)}
        />
      ) : null}
    </section>
  );
}

function CalendarManager({
  calendars,
  current,
  todos,
  calendarOf,
  onSelect,
  onNew,
  onClose,
}: {
  calendars: UserCalendar[];
  current: string;
  todos: Todo[];
  calendarOf(t: Todo): UserCalendar | null;
  onSelect(id: string): void;
  onNew(): void;
  onClose(): void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const filter = useCalendarFilter();
  const c = calendars.find((x) => x.id === current) ?? calendars[0];
  const def = calendars.find((x) => x.isDefault) ?? calendars[0];

  useEffect(() => {
    const d = ref.current;
    const back = document.activeElement as HTMLElement | null;
    if (d && !d.open) d.showModal();
    return () => back?.focus?.();
  }, []);

  const close = () => {
    for (const x of calendars) if (!x.name.trim()) userCalendarActions.update(x.id, { name: t("cal.cm.newName") });
    onClose();
  };
  if (!c) return null;
  const mine = todos.filter((td) => calendarOf(td)?.id === c.id);
  const st = {
    all: mine.length,
    todo: mine.filter((x) => x.status === "not-start").length,
    doing: mine.filter((x) => x.status === "in-progress").length,
    done: mine.filter((x) => x.status === "done").length,
  };
  const vis = !filter.hidden.has(c.id);

  return (
    <dialog
      ref={ref}
      className="cal-cm"
      aria-label={t("cal.cm.label")}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cal-cm-in">
        <aside className="cal-cm-l">
          <div className="cal-cm-h">{t("cal.cals.title")}</div>
          {calendars.map((x) => (
            <button
              key={x.id}
              type="button"
              className="cal-cm-i"
              aria-current={x.id === c.id ? "true" : undefined}
              style={{ "--cc": calendarColorVar(x.color) } as CSSProperties}
              onClick={() => onSelect(x.id)}
            >
              <i aria-hidden="true" />
              <span>{x.name || t("cal.cm.unnamed")}</span>
              {x.isDefault ? <em>{t("cal.cals.default")}</em> : null}
            </button>
          ))}
          <button type="button" className="cal-cm-add" onClick={onNew}>
            + {t("cal.cals.new")}
          </button>
        </aside>
        <section className="cal-cm-r" style={{ "--cc": calendarColorVar(c.color) } as CSSProperties}>
          <div className="cal-cm-top">
            <span>{t("cal.cals.settingsTitle")}</span>
            <button type="button" className="sh-ibtn" aria-label={t("cal.cm.close")} onClick={close}>
              <X size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          </div>
          <div className="cal-cm-name">
            <i aria-hidden="true" />
            <input
              value={c.name}
              placeholder={t("cal.cm.name")}
              aria-label={t("cal.cm.name")}
              autoComplete="off"
              autoFocus={!c.name}
              onChange={(e) => userCalendarActions.update(c.id, { name: e.target.value })}
            />
          </div>
          <div className="cal-cm-row">
            <span>{t("cal.cm.color")}</span>
            <div className="cal-cm-sw" role="radiogroup" aria-label={t("cal.cm.color")}>
              {CALENDAR_COLORS.map((col, i) => (
                <button
                  key={col}
                  type="button"
                  role="radio"
                  aria-checked={col === c.color}
                  aria-label={t("cal.cm.colorN", { n: i + 1 })}
                  style={{ "--sw": calendarColorVar(col) } as CSSProperties}
                  onClick={() => userCalendarActions.update(c.id, { color: col })}
                />
              ))}
            </div>
          </div>
          <div className="cal-cm-row">
            <span>{t("cal.cm.visible")}</span>
            <button
              type="button"
              className="cal-cm-tgl"
              aria-pressed={vis}
              onClick={() => calendarFilterActions.toggleCalendar(c.id)}
            >
              <i aria-hidden="true" />
              {t(vis ? "cal.cm.shown" : "cal.cm.hidden")}
            </button>
          </div>
          <div className="cal-cm-row">
            <span>{t("cal.cm.default")}</span>
            {c.isDefault ? (
              <p className="cal-cm-note">{t("cal.cm.isDefault")}</p>
            ) : (
              <button type="button" className="sh-btn" onClick={() => userCalendarActions.setDefault(c.id)}>
                {t("cal.cm.makeDefault")}
              </button>
            )}
          </div>
          <div className="cal-cm-row">
            <span>{t("cal.cm.todos")}</span>
            <p className="cal-cm-note">{t("cal.cm.stats", st)}</p>
          </div>
          <div className="cal-cm-del">
            {c.isDefault ? (
              <p>{t("cal.cm.cantDelete")}</p>
            ) : (
              <>
                <p>{st.all ? t("cal.cm.deleteMove", { n: st.all, name: def?.name ?? "" }) : t("cal.cm.deleteEmpty")}</p>
                <button
                  type="button"
                  className="cal-cm-delb"
                  onClick={() => {
                    userCalendarActions.remove(c.id);
                    if (def) onSelect(def.id);
                  }}
                >
                  {t("cal.cm.delete")}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </dialog>
  );
}
