import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Calendar, ChevronLeft, Clock, Flag, Plus, Tag, X } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import { MAX_TAGS_PER_TODO, MAX_TAG_LENGTH } from "@/entities/todo/model/types";
import { collectAllTags, collectRecentTags } from "@/entities/todo/lib/selectors";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { useTranslation } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ICON_STROKE } from "@/shared/ui/icons";
import { defaultCalendar } from "../model/calendars";
import { overlapping, parseDayQuery, quickDates, quickDueDates, shiftTimeRange, TIME_SLOTS } from "../model/dates";
import { useModalDialog, type EditorEnv } from "../model/editorEnv";
import {
  dateLabel,
  relativeDayWord,
  STATUS_ORDER,
  statusLabel,
  tagsLabel,
  timeLabel,
  timeRangeLabel,
} from "../model/format";
import { draftFromDefaults, useTodoDraft } from "../model/useTodoDraft";
import type { TodoEditorDefaults } from "../model/useTodoEditor";
import { MonthCalendar } from "./MonthCalendar";
import { PropertyRow } from "./PropertyRow";
import { ValuePicker, type PickerOption } from "./ValuePicker";

type PropKey = "date" | "time" | "due" | "cal" | "tags" | "st";
type Menu = { prop: PropKey; view: "list" | "calendar" };

const ic = (Icon: typeof Calendar) => <Icon size={14} strokeWidth={ICON_STROKE} aria-hidden />;

/**
 * 새 할 일 창(3번): 할 일 모달(26)과 같은 속성 줄. 날짜, 시간대, 마감일, 캘린더, 태그가 보이고
 * 상태는 "더 보기", 메모는 아래 본문. 추가하면 닫힌다(Ctrl Enter, 제목에서 Enter).
 */
export function NewTodoDialog({
  defaults,
  env,
  onClose,
}: {
  defaults: Partial<TodoEditorDefaults>;
  env: EditorEnv;
  onClose: () => void;
}) {
  const app = useArchiveApp();
  const { state } = app;
  const { t, locale } = useTranslation();
  const today = useTodayKey();
  const userCals = useServerFeature("userCalendars");
  const [d, patch] = useTodoDraft(() => draftFromDefaults(defaults, today, defaultCalendar(env.calendars)?.id ?? ""));
  const [menu, setMenu] = useState<Menu | null>(null);
  const [moreStatus, setMoreStatus] = useState(false);
  const [shake, setShake] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const ref = useModalDialog(".nw-title");
  const allTags = useMemo(
    () => [...new Set([...collectRecentTags(state.todos), ...collectAllTags(state.todos), ...d.tags])],
    [state.todos, d.tags],
  );
  const calendar = env.calendars.find((c) => c.id === d.calendarId) ?? defaultCalendar(env.calendars);

  const focusProp = (p: PropKey) =>
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-prop="${p}"]`)?.focus());
  const choose = (p: Partial<typeof d>) => {
    patch(p);
    if (menu) focusProp(menu.prop);
    setMenu(null);
  };

  const submit = () => {
    const title = d.title.trim();
    if (!title) {
      setShake(true);
      titleRef.current?.focus();
      return;
    }
    const draft = d;
    app.addTodo(
      title,
      draft.dateKey,
      { status: draft.status, description: draft.description || undefined, tags: draft.tags },
      (id) =>
        // 새 id 가 목록에 들어온 뒤 시간대(없으면 종일), 마감일, 캘린더를 이어서 적는다.
        env.afterCreate(id, (latest) => {
          latest.setTodoTime(id, draft.startTime, draft.endTime);
          if (draft.dueDate) latest.updateTodo(id, { dueDate: draft.dueDate });
          if (userCals) env.setCalendar(id, draft.calendarId);
        }),
    );
    onClose();
  };

  // ---------- 값 ----------
  const dot = (color: string) => <i className="tm-dot" style={{ "--cc": color } as CSSProperties} aria-hidden />;
  const rel = relativeDayWord(d.dateKey, today, t);
  const dateText = rel ? t("todoEditor.nw.relDate", { rel, date: dateLabel(d.dateKey, locale) }) : dateLabel(d.dateKey, locale);
  const rows: { key: PropKey; label: string; icon: ReactNode; value: string; empty: string }[] = [
    { key: "date", label: t("todoEditor.prop.date"), icon: ic(Calendar), value: dateText, empty: t("todoEditor.nw.dateNone") },
    {
      key: "time",
      label: t("todoEditor.prop.time"),
      icon: ic(Clock),
      value: timeRangeLabel(d, t, locale),
      empty: t("todoEditor.nw.timeNone"),
    },
    {
      key: "due",
      label: t("todoEditor.prop.due"),
      icon: ic(Flag),
      value: d.dueDate ? t("todoEditor.nw.dueUntil", { date: dateLabel(d.dueDate, locale) }) : "",
      empty: t("todoEditor.nw.dueNone"),
    },
    ...(userCals && calendar
      ? [{ key: "cal" as const, label: t("todoEditor.prop.calendar"), icon: dot(calendar.color), value: calendar.name, empty: "" }]
      : []),
    { key: "tags", label: t("todoEditor.prop.tags"), icon: ic(Tag), value: tagsLabel(d.tags), empty: t("todoEditor.nw.tagsNone") },
    ...(moreStatus
      ? [
          {
            key: "st" as const,
            label: t("todoEditor.prop.status"),
            icon: <StatusIcon status={d.status} size={14} />,
            value: statusLabel(d.status, t),
            empty: "",
          },
        ]
      : []),
  ];

  // ---------- 찾기 메뉴 ----------
  const opt = (key: string, content: ReactNode, text: string, on: boolean, run: () => void, extra: Partial<PickerOption> = {}) => ({
    key,
    content,
    text,
    on,
    run,
    ...extra,
  });
  const calendarRow = (prop: PropKey) =>
    opt(
      "calendar",
      <>
        {ic(Calendar)}
        {t("todoEditor.nw.otherDay")}
      </>,
      t("todoEditor.nw.otherDay"),
      false,
      () => setMenu({ prop, view: "calendar" }),
      { keep: true },
    );
  const options = (prop: PropKey) => (q: string): PickerOption[] => {
    const typed = parseDayQuery(q, today);
    const typedRow = (field: "dateKey" | "dueDate") =>
      typed && (field === "dateKey" || typed >= d.dateKey)
        ? [
            opt(
              "typed",
              <>
                {dateLabel(typed, locale)} <em>{t("todoEditor.menu.typed")}</em>
              </>,
              q,
              d[field] === typed,
              () => choose({ [field]: typed }),
              { keep: true },
            ),
          ]
        : [];
    switch (prop) {
      case "date":
        return [
          ...typedRow("dateKey"),
          ...quickDates(today).map(({ id, dateKey }) =>
            opt(
              id,
              <>
                {t(`todoEditor.quick.${id}`)} <em>{dateLabel(dateKey, locale)}</em>
              </>,
              `${t(`todoEditor.quick.${id}`)} ${dateLabel(dateKey, locale)}`,
              d.dateKey === dateKey,
              () => choose({ dateKey }),
            ),
          ),
          calendarRow("date"),
        ];
      case "due":
        return [
          ...typedRow("dueDate"),
          opt("none", t("todoEditor.nw.dueNone"), t("todoEditor.nw.dueNone"), !d.dueDate, () => choose({ dueDate: null })),
          ...quickDueDates(d.dateKey).map(({ id, dateKey }) =>
            opt(
              id,
              <>
                {t(`todoEditor.quick.${id}`)} <em>{dateLabel(dateKey, locale)}</em>
              </>,
              `${t(`todoEditor.quick.${id}`)} ${dateLabel(dateKey, locale)}`,
              d.dueDate === dateKey,
              () => choose({ dueDate: dateKey }),
            ),
          ),
          calendarRow("due"),
        ];
      case "time":
        return [
          opt(
            "none",
            <>
              {t("todoEditor.nw.timeNone")} <em>{t("todoEditor.nw.allDaySub")}</em>
            </>,
            t("todoEditor.nw.timeNone"),
            !d.startTime,
            () => choose({ startTime: null, endTime: null }),
          ),
          ...TIME_SLOTS.map((s) =>
            opt(
              s,
              <>
                {timeLabel(s, locale)} <em>~ {timeLabel(shiftTimeRange(s, d).endTime, locale)}</em>
              </>,
              `${timeLabel(s, locale)} ${s}`,
              d.startTime === s,
              () => choose(shiftTimeRange(s, d)),
            ),
          ),
        ];
      case "cal":
        return env.calendars.map((c) =>
          opt(
            c.id,
            <>
              {dot(c.color)}
              {c.name}
              {c.isDefault ? <em>{t("todoEditor.cal.default")}</em> : null}
            </>,
            c.name,
            d.calendarId === c.id,
            () => choose({ calendarId: c.id }),
          ),
        );
      case "tags": {
        const qq = q.trim().replace(/^#/, "").slice(0, MAX_TAG_LENGTH);
        const toggle = (tag: string) => {
          const has = d.tags.includes(tag);
          if (!has && d.tags.length >= MAX_TAGS_PER_TODO) return;
          patch({ tags: has ? d.tags.filter((x) => x !== tag) : [...d.tags, tag] });
        };
        const list = allTags.map((tag) => opt(`tag-${tag}`, `#${tag}`, `#${tag}`, d.tags.includes(tag), () => toggle(tag)));
        if (qq && !allTags.includes(qq))
          list.push(
            opt(
              "new",
              <>
                {ic(Plus)}
                {t("todoEditor.nw.tagCreate", { tag: qq })}
              </>,
              qq,
              false,
              () => toggle(qq),
              { keep: true },
            ),
          );
        return list;
      }
      case "st":
        return STATUS_ORDER.map((s, i) =>
          opt(
            s,
            <>
              <StatusIcon status={s} size={14} />
              {statusLabel(s, t)}
            </>,
            statusLabel(s, t),
            d.status === s,
            () => choose({ status: s }),
            { kbd: String(i + 1) },
          ),
        );
    }
  };
  const placeholder = (p: PropKey, label: string) =>
    p === "date" || p === "due"
      ? t("todoEditor.menu.findDate")
      : p === "tags"
        ? t("todoEditor.nw.tagFind")
        : p === "time"
          ? t("todoEditor.menu.findTime")
          : t("todoEditor.menu.find", { prop: label });

  const menuFor = (row: (typeof rows)[number]) => {
    if (!menu || menu.prop !== row.key) return null;
    if (menu.view === "calendar") {
      const isDue = row.key === "due";
      return (
        <div className="zm wide" role="dialog" aria-label={t("todoEditor.menu.calendarAria", { prop: row.label })}>
          <button type="button" className="zm-back" onClick={() => setMenu({ ...menu, view: "list" })}>
            {ic(ChevronLeft)}
            {t("todoEditor.menu.back")}
          </button>
          <MonthCalendar
            value={isDue ? d.dueDate : d.dateKey}
            min={isDue ? d.dateKey : null}
            today={today}
            label={row.label}
            onPick={(v) => choose(isDue ? { dueDate: v } : { dateKey: v })}
          />
        </div>
      );
    }
    return (
      <ValuePicker
        label={t("todoEditor.nw.pickAria", { prop: row.label })}
        placeholder={placeholder(row.key, row.label)}
        options={options(row.key)}
      />
    );
  };

  // ---------- 아래 안내 ----------
  const day = rel ?? dateLabel(d.dateKey, locale);
  const clash = overlapping(state.todos, d);
  const hint = d.startTime
    ? t("todoEditor.nw.hintTimed", { day, time: timeLabel(d.startTime, locale) })
    : t("todoEditor.nw.hintAllDay", { day });

  return (
    <dialog
      ref={ref}
      className="te-dlg te-nw"
      aria-label={t("todoEditor.new")}
      onCancel={(e) => {
        e.preventDefault();
        if (menu) {
          if (menu.view !== "list") setMenu({ ...menu, view: "list" });
          else choose({});
          return;
        }
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="nw nw3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onKeyDown={(e) => {
          // 메뉴는 Esc 를 keydown 에서 닫는다(연달아 누른 Esc 에 Chrome 이 창째 닫지 않게).
          if (e.key === "Escape" && menu) {
            e.preventDefault();
            e.stopPropagation();
            if (menu.view !== "list") setMenu({ ...menu, view: "list" });
            else choose({});
            return;
          }
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
        onPointerDown={(e) => {
          const el = e.target as HTMLElement;
          if (menu && !el.closest(".zm") && !el.closest(`[data-prop="${menu.prop}"]`)) setMenu(null);
        }}
      >
        <div className="nw3-top">
          <p className="nw3-crumb">
            {userCals && calendar ? (
              <span className="te-cal">
                {dot(calendar.color)}
                {calendar.name}
              </span>
            ) : null}
            <span>{dateLabel(d.dateKey, locale)}</span>
            <em>{t("todoEditor.new")}</em>
          </p>
          <button type="button" className="tm-ib" aria-label={t("todoEditor.close")} onClick={onClose}>
            <X size={16} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
        </div>
        <input
          ref={titleRef}
          className={`nw-title big${shake ? " shake" : ""}`}
          value={d.title}
          placeholder={t("todoEditor.titleEmpty")}
          aria-label={t("todoEditor.title")}
          maxLength={200}
          autoComplete="off"
          spellCheck={false}
          onAnimationEnd={() => setShake(false)}
          onChange={(e) => patch({ title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="z26-p">
          {rows.map((row) => (
            <PropertyRow
              key={row.key}
              prop={row.key}
              icon={row.icon}
              label={row.label}
              value={row.value}
              ariaValue={row.value}
              emptyText={row.empty}
              open={menu?.prop === row.key}
              onToggle={() => setMenu((m) => (m?.prop === row.key ? null : { prop: row.key, view: "list" }))}
              menu={menuFor(row)}
            />
          ))}
          <button type="button" className="z26-more" aria-expanded={moreStatus} onClick={() => setMoreStatus((v) => !v)}>
            {moreStatus
              ? t("todoEditor.nw.hideStatus")
              : t("todoEditor.nw.moreStatus", { status: statusLabel(d.status, t) })}
          </button>
        </div>
        <textarea
          className="nw3-desc"
          rows={4}
          value={d.description}
          placeholder={t("todoEditor.descPlaceholder")}
          aria-label={t("todoEditor.desc")}
          onChange={(e) => patch({ description: e.target.value })}
        />
        <div className="nw-f">
          <p className="nw-hint" aria-live="polite">
            {hint}
            {clash.length ? (
              <>
                {" "}
                <b>
                  {t("todoEditor.nw.clash", {
                    title:
                      clash.length > 1
                        ? t("todoEditor.nw.clashMore", { title: clash[0].title, n: clash.length - 1 })
                        : clash[0].title,
                  })}
                </b>
              </>
            ) : null}
          </p>
          <span className="sh-kbd te-kbd">{t("todoEditor.nw.kbd")}</span>
          <button type="button" className="sh-btn" onClick={onClose}>
            {t("todoEditor.nw.cancel")}
          </button>
          <button type="submit" className="sh-btn sh-btn-p">
            {t("todoEditor.nw.add")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
