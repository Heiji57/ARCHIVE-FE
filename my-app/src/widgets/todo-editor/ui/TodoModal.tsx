import { useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from "react";
import { ArrowDownToLine, Calendar, ChevronLeft, Clock, Flag, Plus, Repeat, Tag, Trash2, TriangleAlert, X } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type { RecurrenceRule, Todo } from "@/entities/todo/model/types";
import { MAX_TAGS_PER_TODO, MAX_TAG_LENGTH } from "@/entities/todo/model/types";
import {
  buildRecurrencePresets,
  formatRecurrenceRule,
  monthDayLabel,
  sameRecurrenceRule,
} from "@/entities/todo/lib/recurrence";
import { collectAllTags, collectRecentTags, isRecurringTodo } from "@/entities/todo/lib/selectors";
import { StatusIcon } from "@/entities/todo/ui/StatusIcon";
import { USE_API } from "@/shared/api/config";
import { useTranslation } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ICON_STROKE } from "@/shared/ui/icons";
import { applyScope, seriesOf, toEditorCalls, type EditScope, type EditorCall, type TodoPatch } from "../model/applyScope";
import { parseDayQuery, quickDates, quickDueDates, shiftTimeRange, TIME_SLOTS } from "../model/dates";
import { useModalDialog, type EditorEnv } from "../model/editorEnv";
import {
  dateLabel,
  dueRelative,
  googleLabel,
  googleState,
  STATUS_ORDER,
  statusLabel,
  tagsLabel,
  timeLabel,
  timeRangeLabel,
} from "../model/format";
import { MonthCalendar } from "./MonthCalendar";
import { PropertyRow } from "./PropertyRow";
import { RepeatBuilder } from "./RepeatBuilder";
import { RepeatScopeDialog } from "./RepeatScopeDialog";
import { ValuePicker, type PickerOption } from "./ValuePicker";

type PropKey = "st" | "date" | "due" | "time" | "rep" | "tags" | "cal" | "g";
type Menu = { prop: PropKey; view: "list" | "calendar" | "custom" };
interface Ask {
  title: string;
  note?: string;
  kind: "edit" | "delete";
  run(scope: EditScope): void;
  /** 취소하면 되돌릴 입력(제목, 설명). */
  revert?: () => void;
  /** 끝나면 포커스를 돌려줄 곳. */
  focus: string;
}

const ic = (Icon: typeof Calendar) => <Icon size={14} strokeWidth={ICON_STROKE} aria-hidden />;

/** 할 일 모달(26번): 가운데 모달, 문서처럼 속성 목록, 빈 속성 숨김, 값 옆 찾기 메뉴, 반복 범위 질문. */
export function TodoModal({
  todoId,
  env,
  onClose,
  onSwitch,
}: {
  todoId: string;
  env: EditorEnv;
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  const { state } = useArchiveApp();
  const { t } = useTranslation();
  const todo = state.todos.find((x) => x.id === todoId);
  const cancelRef = useRef<(() => boolean) | null>(null);
  const ref = useModalDialog("[data-close]");

  return (
    <dialog
      ref={ref}
      className="te-dlg te-tm"
      aria-label={todo ? t("todoEditor.label", { title: todo.title }) : t("todoEditor.missing")}
      onCancel={(e) => {
        e.preventDefault();
        if (cancelRef.current?.()) return;
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {todo ? (
        <ModalBody key={todo.id} todo={todo} env={env} onClose={onClose} onSwitch={onSwitch} cancelRef={cancelRef} />
      ) : (
        <div className="tm te-missing">
          <p>{t("todoEditor.missing")}</p>
          <button type="button" className="sh-btn" data-close onClick={onClose}>
            {t("todoEditor.close")}
          </button>
        </div>
      )}
    </dialog>
  );
}

function ModalBody({
  todo,
  env,
  onClose,
  onSwitch,
  cancelRef,
}: {
  todo: Todo;
  env: EditorEnv;
  onClose: () => void;
  onSwitch: (id: string) => void;
  cancelRef: MutableRefObject<(() => boolean) | null>;
}) {
  const app = useArchiveApp();
  const { state } = app;
  const { t, locale } = useTranslation();
  const today = useTodayKey();
  const userCals = useServerFeature("userCalendars");
  /** 서버를 부르지 않는 모드(데모, mock): 반복을 펼치지 않아 보이는 한 건이 시리즈 전체다. */
  const local = !USE_API || app.isDemo;
  const [menu, setMenu] = useState<Menu | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [title, setTitle] = useState(todo.title);
  const [desc, setDesc] = useState(todo.description ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const recurring = isRecurringTodo(todo);
  const rule = todo.seriesRule ?? todo.recurrenceRule ?? null;
  const allTags = useMemo(() => {
    const recent = collectRecentTags(state.todos);
    return [...new Set([...recent, ...collectAllTags(state.todos)])];
  }, [state.todos]);
  const calStatus = state.calendar.status;
  const gs = googleState(todo, calStatus);

  const focusSel = (sel: string) =>
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(sel)?.focus());
  const focusProp = (p: PropKey) => focusSel(`[data-prop="${p}"]`);
  const closeMenu = (focus = true) => {
    if (focus && menu) focusProp(menu.prop);
    setMenu(null);
  };

  useEffect(() => {
    cancelRef.current = () => {
      if (ask) {
        ask.revert?.();
        setAsk(null);
        focusSel(ask.focus);
        return true;
      }
      if (menu) {
        if (menu.view !== "list") setMenu({ ...menu, view: "list" });
        else closeMenu();
        return true;
      }
      return false;
    };
  });

  // 반복 변경 응답은 새 시리즈의 base 라서, 같은 날짜의 회차가 목록에 있으면 그리로 옮긴다.
  const follow = async (p: Promise<Todo | null>) => {
    const server = await p;
    if (!server) return;
    const match = state.todos.find((x) => x.seriesId === server.id && x.dateKey === todo.dateKey);
    onSwitch(match ? match.id : server.id);
  };
  const run = (calls: EditorCall[]) => {
    for (const c of calls) {
      if (c.action === "updateTodo") app.updateTodo(c.id, c.patch);
      else if (c.action === "setTodoTime") app.setTodoTime(c.id, c.startTime, c.endTime);
      else if (c.action === "updateTodoFollowing") void follow(app.updateTodoFollowing(c.id, c.patch));
      else if (c.action === "updateTodoTimeRecurrence")
        void follow(app.updateTodoTimeRecurrence(c.id, c.startTime, c.endTime));
      else void follow(app.updateTodoRecurrence(c.id, c.rule));
    }
  };

  /** 반복 할 일이면 범위를 묻고, 아니면 바로 적용한다(제목, 설명, 태그, 시간대). */
  const gate = (kind: "field" | "time", patch: TodoPatch, focus: string, revert?: () => void) => {
    const s = seriesOf(todo, state.todos);
    if (!s) {
      run(
        toEditorCalls([{ kind: "occurrence", seriesId: todo.id, dateKey: todo.dateKey, patch }], {
          instanceId: todo.id,
          demo: local,
          seriesRule: null,
        }),
      );
      return;
    }
    setAsk({
      kind: "edit",
      title: t(kind === "time" ? "todoEditor.ask.time" : "todoEditor.ask.field"),
      focus,
      revert,
      run: (scope) =>
        run(
          toEditorCalls(applyScope(s.series, s.instanceDateKey, patch, scope), {
            instanceId: todo.id,
            demo: local,
            seriesRule: s.series.rule,
          }),
        ),
    });
  };

  const setRule = (r: RecurrenceRule) => {
    closeMenu();
    if (rule && sameRecurrenceRule(r, rule, todo.dateKey)) return;
    // 반복 규칙은 묻지 않고 이 일정부터 이후 전체에 적용한다(가상 회차), 반복이 아니면 이 날을 첫 회차로.
    if (todo.isVirtual) void follow(app.updateTodoRecurrence(todo.id, r));
    else void follow(app.convertTodoToRecurring(todo.id, r));
  };

  const requestDelete = () =>
    setAsk({
      kind: "delete",
      title: recurring ? t("todoEditor.ask.delete") : t("todoEditor.ask.deleteOne"),
      note: todo.calendarLinked ? t("todoEditor.ask.deleteNote") : undefined,
      focus: "[data-del]",
      run: (scope) => {
        app.removeTodo(todo.id, recurring ? scope : undefined);
        onClose();
      },
    });

  const commitTitle = () => {
    const v = title.trim();
    if (!v || v === todo.title) {
      setTitle(todo.title);
      return;
    }
    gate("field", { title: v }, ".z-title", () => setTitle(todo.title));
  };
  const commitDesc = () => {
    if (desc === (todo.description ?? "")) return;
    gate("field", { description: desc }, ".z-desc", () => setDesc(todo.description ?? ""));
  };

  const toggleTag = (tag: string) => {
    const has = todo.tags.includes(tag);
    if (!has && todo.tags.length >= MAX_TAGS_PER_TODO) return;
    const next = has ? todo.tags.filter((x) => x !== tag) : [...todo.tags, tag];
    if (recurring) setMenu(null);
    gate("field", { tags: next }, '[data-prop="tags"]');
  };

  // ---------- 값 글자 ----------
  const calendar = env.calendars.find((c) => c.id === env.calendarIdOf(todo)) ?? env.calendars[0];
  const dot = (color: string) => <i className="tm-dot" style={{ "--cc": color } as CSSProperties} aria-hidden />;
  const ruleText = rule ? formatRecurrenceRule(rule, todo.dateKey, t, locale) : "";
  const due = todo.dueDate ? dueRelative(todo.dueDate, today, t) : null;
  const gText = googleLabel(gs, t);

  const PROPS: { key: PropKey; label: string; icon: ReactNode; value: ReactNode; aria: string }[] = [
    {
      key: "st",
      label: t("todoEditor.prop.status"),
      icon: <StatusIcon status={todo.status} size={14} />,
      value: statusLabel(todo.status, t),
      aria: statusLabel(todo.status, t),
    },
    {
      key: "date",
      label: t("todoEditor.prop.date"),
      icon: ic(Calendar),
      value: dateLabel(todo.dateKey, locale),
      aria: dateLabel(todo.dateKey, locale),
    },
    {
      key: "due",
      label: t("todoEditor.prop.due"),
      icon: ic(Flag),
      value:
        todo.dueDate && due ? (
          <>
            {dateLabel(todo.dueDate, locale)}
            <em className={due.tone}>{due.text}</em>
          </>
        ) : (
          ""
        ),
      aria: todo.dueDate && due ? `${dateLabel(todo.dueDate, locale)} ${due.text}` : "",
    },
    {
      key: "time",
      label: t("todoEditor.prop.time"),
      icon: ic(Clock),
      value: timeRangeLabel(todo, t, locale),
      aria: timeRangeLabel(todo, t, locale),
    },
    { key: "rep", label: t("todoEditor.prop.repeat"), icon: ic(Repeat), value: ruleText, aria: ruleText },
    {
      key: "tags",
      label: t("todoEditor.prop.tags"),
      icon: ic(Tag),
      value: tagsLabel(todo.tags),
      aria: tagsLabel(todo.tags),
    },
    ...(userCals && calendar
      ? [
          {
            key: "cal" as const,
            label: t("todoEditor.prop.calendar"),
            icon: dot(calendar.color),
            value: calendar.name,
            aria: calendar.name,
          },
        ]
      : []),
    {
      key: "g",
      label: t("todoEditor.prop.google"),
      icon: ic(ArrowDownToLine),
      value: gText ? <em className={gs === "failed" || gs === "reauth" ? "late" : ""}>{gText}</em> : "",
      aria: gText,
    },
  ];
  const hasValue = (p: (typeof PROPS)[number]) => p.value !== "";
  const shown = PROPS.filter((p) => p.key === "due" || hasValue(p) || showEmpty || menu?.prop === p.key);
  const hidden = PROPS.length - shown.length;

  // ---------- 찾기 메뉴 항목 ----------
  const pick = (k: string, content: ReactNode, text: string, on: boolean, runIt: () => void, extra: Partial<PickerOption> = {}): PickerOption => ({
    key: k,
    content,
    text,
    on,
    run: runIt,
    ...extra,
  });
  const calendarRow = (prop: PropKey) =>
    pick(
      "calendar",
      <>
        {ic(Calendar)}
        {t("todoEditor.menu.calendar")}
      </>,
      t("todoEditor.menu.calendar"),
      false,
      () => setMenu({ prop, view: "calendar" }),
      { keep: true },
    );
  const setDate = (v: string) => {
    app.updateTodo(todo.id, todo.dueDate && todo.dueDate < v ? { dateKey: v, dueDate: null } : { dateKey: v });
    closeMenu();
  };
  const setDue = (v: string | null) => {
    app.updateTodo(todo.id, { dueDate: v });
    closeMenu();
  };
  const setTime = (start: string | null) => {
    setMenu(null);
    const patch = start ? shiftTimeRange(start, todo) : { startTime: null, endTime: null };
    gate("time", patch, '[data-prop="time"]');
    if (!recurring) focusProp("time");
  };

  const options = (prop: PropKey) => (q: string): PickerOption[] => {
    const typed = parseDayQuery(q, today);
    switch (prop) {
      case "st":
        return STATUS_ORDER.map((s, i) =>
          pick(
            s,
            <>
              <StatusIcon status={s} size={14} />
              {statusLabel(s, t)}
            </>,
            statusLabel(s, t),
            todo.status === s,
            () => {
              app.updateTodo(todo.id, { status: s });
              closeMenu();
            },
            { kbd: String(i + 1) },
          ),
        );
      case "date":
        return [
          ...(typed
            ? [
                pick(
                  "typed",
                  <>
                    {dateLabel(typed, locale)} <em>{t("todoEditor.menu.typed")}</em>
                  </>,
                  q,
                  todo.dateKey === typed,
                  () => setDate(typed),
                  { keep: true },
                ),
              ]
            : []),
          ...quickDates(today).map(({ id, dateKey }) =>
            pick(
              id,
              <>
                {t(`todoEditor.quick.${id}`)} <em>{dateLabel(dateKey, locale)}</em>
              </>,
              `${t(`todoEditor.quick.${id}`)} ${dateLabel(dateKey, locale)}`,
              todo.dateKey === dateKey,
              () => setDate(dateKey),
            ),
          ),
          calendarRow("date"),
        ];
      case "due":
        return [
          ...(typed && typed >= todo.dateKey
            ? [
                pick(
                  "typed",
                  <>
                    {dateLabel(typed, locale)} <em>{t("todoEditor.menu.typed")}</em>
                  </>,
                  q,
                  todo.dueDate === typed,
                  () => setDue(typed),
                  { keep: true },
                ),
              ]
            : []),
          pick(
            "none",
            <>
              {t("todoEditor.quick.none")} <em>{t("todoEditor.quick.clearDue")}</em>
            </>,
            t("todoEditor.quick.none"),
            !todo.dueDate,
            () => setDue(null),
          ),
          ...quickDueDates(todo.dateKey).map(({ id, dateKey }) =>
            pick(
              id,
              <>
                {t(`todoEditor.quick.${id}`)} <em>{dateLabel(dateKey, locale)}</em>
              </>,
              `${t(`todoEditor.quick.${id}`)} ${dateLabel(dateKey, locale)}`,
              todo.dueDate === dateKey,
              () => setDue(dateKey),
            ),
          ),
          calendarRow("due"),
        ];
      case "time":
        return [
          pick(
            "allday",
            <>
              {t("todoEditor.allDay")} <em>{t("todoEditor.allDayHint")}</em>
            </>,
            t("todoEditor.allDay"),
            !todo.startTime,
            () => setTime(null),
          ),
          ...TIME_SLOTS.map((s) =>
            pick(
              s,
              <>
                {timeLabel(s, locale)} <em>~ {timeLabel(shiftTimeRange(s, todo).endTime, locale)}</em>
              </>,
              `${timeLabel(s, locale)} ${s}`,
              todo.startTime === s,
              () => setTime(s),
            ),
          ),
        ];
      case "rep": {
        const presets = buildRecurrencePresets(todo.dateKey);
        const custom = rule && !presets.some((p) => sameRecurrenceRule(p.rule, rule, todo.dateKey));
        return [
          ...(custom && rule
            ? [
                pick(
                  "current",
                  <>
                    {ruleText} <em>{t("todoEditor.repeat.custom")}</em>
                  </>,
                  ruleText,
                  true,
                  () => closeMenu(),
                ),
              ]
            : []),
          ...presets.map((p) => {
            const text = formatRecurrenceRule(p.rule, todo.dateKey, t, locale);
            return pick(p.id, text, text, Boolean(rule && sameRecurrenceRule(p.rule, rule, todo.dateKey)), () =>
              setRule(p.rule),
            );
          }),
          pick(
            "custom",
            <>
              {ic(Plus)}
              {t("todoEditor.repeat.makeCustom")}
            </>,
            t("todoEditor.repeat.makeCustom"),
            false,
            () => setMenu({ prop: "rep", view: "custom" }),
            { keep: true },
          ),
        ];
      }
      case "tags": {
        const qq = q.trim().replace(/^#/, "").slice(0, MAX_TAG_LENGTH);
        const list = allTags.map((tag) => pick(`tag-${tag}`, `#${tag}`, `#${tag}`, todo.tags.includes(tag), () => toggleTag(tag)));
        if (qq && !allTags.includes(qq))
          list.push(
            pick(
              "new",
              <>
                {ic(Plus)}
                {t("todoEditor.tags.create", { tag: qq })}
              </>,
              qq,
              false,
              () => toggleTag(qq),
              { keep: true },
            ),
          );
        return list;
      }
      case "cal":
        return env.calendars.map((c) =>
          pick(
            c.id,
            <>
              {dot(c.color)}
              {c.name}
              {c.isDefault ? <em>{t("todoEditor.cal.default")}</em> : null}
            </>,
            c.name,
            calendar?.id === c.id,
            () => {
              env.setCalendar(todo.id, c.id);
              closeMenu();
            },
          ),
        );
      case "g": {
        const settings = (key: "todoEditor.g.connect" | "todoEditor.g.reconnect") =>
          env.openSettings
            ? [
                pick(key, <>{gs === "reauth" ? ic(TriangleAlert) : null}{t(key)}</>, t(key), false, () => {
                  closeMenu(false);
                  onClose();
                  env.openSettings?.("link");
                }),
              ]
            : [];
        if (gs === "reauth") return settings("todoEditor.g.reconnect");
        if (calStatus !== "connected") return settings("todoEditor.g.connect");
        const toggle = () => {
          app.toggleTodoCalendarLink(todo.id);
          closeMenu();
        };
        const out: PickerOption[] = [];
        if (gs === "none") out.push(pick("add", t("todoEditor.g.add"), t("todoEditor.g.add"), false, toggle));
        if (gs === "failed") out.push(pick("resend", t("todoEditor.g.resend"), t("todoEditor.g.resend"), false, toggle));
        if (todo.calendarLinked && gs !== "pending_delete")
          out.push(pick("remove", t("todoEditor.g.remove"), t("todoEditor.g.remove"), false, toggle));
        return out;
      }
    }
  };

  const placeholder = (p: PropKey, label: string) =>
    p === "date" || p === "due"
      ? t("todoEditor.menu.findDate")
      : p === "tags"
        ? t("todoEditor.menu.findTags")
        : p === "time"
          ? t("todoEditor.menu.findTime")
          : t("todoEditor.menu.find", { prop: label });

  const menuFor = (p: (typeof PROPS)[number]) => {
    if (!menu || menu.prop !== p.key) return null;
    if (menu.view === "calendar") {
      const isDue = p.key === "due";
      return (
        <div className="zm wide" role="dialog" aria-label={t("todoEditor.menu.calendarAria", { prop: p.label })}>
          <button type="button" className="zm-back" onClick={() => setMenu({ ...menu, view: "list" })}>
            {ic(ChevronLeft)}
            {t("todoEditor.menu.back")}
          </button>
          <AutoFocus sel='.z-g button[aria-pressed="true"]:not(:disabled), .z-g button:not(:disabled)'>
            <MonthCalendar
              value={isDue ? (todo.dueDate ?? null) : todo.dateKey}
              min={isDue ? todo.dateKey : null}
              today={today}
              label={p.label}
              onPick={(d) => (isDue ? setDue(d) : setDate(d))}
            />
          </AutoFocus>
        </div>
      );
    }
    if (menu.view === "custom") {
      return (
        <div className="zm wide" role="dialog" aria-label={t("todoEditor.cx.title")}>
          <AutoFocus sel='.z-seg button[aria-checked="true"]'>
            <RepeatBuilder
              dateKey={todo.dateKey}
              rule={rule}
              recurring={recurring}
              today={today}
              onCancel={() => setMenu({ ...menu, view: "list" })}
              onApply={setRule}
            />
          </AutoFocus>
        </div>
      );
    }
    return (
      <ValuePicker
        label={t("todoEditor.menu.label", { prop: p.label })}
        placeholder={placeholder(p.key, p.label)}
        options={options(p.key)}
      />
    );
  };

  return (
    <div
      className="tm z26"
      ref={rootRef}
      onPointerDown={(e) => {
        const el = e.target as HTMLElement;
        if (menu && !el.closest(".zm") && !el.closest(`[data-prop="${menu.prop}"]`)) setMenu(null);
      }}
      onKeyDown={(e) => {
        // 범위 묻기, 메뉴는 Esc 를 keydown 에서 먼저 받는다. 연달아 누른 Esc 를 Chrome 이
        // cancel 없이 창째 닫아 버리기 때문(사용자 활성화 없는 두 번째 close request).
        if (e.key === "Escape" && cancelRef.current?.()) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (e.key !== "Delete" || ask) return;
        const el = e.target as HTMLElement;
        if (el.closest("input, textarea, [contenteditable='true']")) return;
        e.preventDefault();
        requestDelete();
      }}
    >
      <div className="z26-doc">
        <div className="z26-top">
          <p className="z26-crumb">
            {userCals && calendar ? (
              <span className="te-cal">
                {dot(calendar.color)}
                {calendar.name}
              </span>
            ) : null}
            <span>{monthDayLabel(todo.dateKey, locale)}</span>
            {recurring ? (
              <span className="z-rb">
                <Repeat size={12} strokeWidth={ICON_STROKE} aria-hidden />
                <span>{ruleText ? t("todoEditor.repeatBadge", { rule: ruleText }) : t("todoEditor.prop.repeat")}</span>
              </span>
            ) : null}
          </p>
          <button
            type="button"
            className="z-del"
            data-del
            aria-label={t("todoEditor.delete")}
            aria-keyshortcuts="Delete"
            onClick={requestDelete}
          >
            <Trash2 size={16} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
          <button type="button" className="tm-ib" data-close aria-label={t("todoEditor.close")} onClick={onClose}>
            <X size={16} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
        </div>
        <input
          className="z-title big"
          value={title}
          aria-label={t("todoEditor.title")}
          maxLength={200}
          autoComplete="off"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              // 기본 동작을 막지 않으면 이 Enter 가 곧바로 뜬 범위 질문의 첫 단추를 누른다.
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
        <div className="z26-p">
          {shown.map((p) => (
            <PropertyRow
              key={p.key}
              prop={p.key}
              icon={p.icon}
              label={p.label}
              value={p.value}
              ariaValue={p.aria}
              emptyText={p.key === "due" ? t("todoEditor.dueSet") : t("todoEditor.empty")}
              open={menu?.prop === p.key}
              onToggle={() => setMenu((m) => (m?.prop === p.key ? null : { prop: p.key, view: "list" }))}
              menu={menuFor(p)}
            />
          ))}
          {hidden ? (
            <button type="button" className="z26-more" aria-expanded={false} onClick={() => setShowEmpty(true)}>
              {t("todoEditor.moreEmpty", { n: hidden })}
            </button>
          ) : showEmpty ? (
            <button type="button" className="z26-more" aria-expanded onClick={() => setShowEmpty(false)}>
              {t("todoEditor.hideEmpty")}
            </button>
          ) : null}
        </div>
        <div className="z26-body">
          <textarea
            className="z-desc"
            value={desc}
            aria-label={t("todoEditor.desc")}
            placeholder={t("todoEditor.descPlaceholder")}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={commitDesc}
          />
        </div>
      </div>
      {ask ? (
        <RepeatScopeDialog
          title={ask.title}
          note={ask.note}
          recurring={recurring}
          danger={ask.kind === "delete"}
          deleteLabel={t("todoEditor.delete")}
          onChoose={(scope) => {
            setAsk(null);
            ask.run(scope);
            if (ask.kind !== "delete") focusSel(ask.focus);
          }}
          onCancel={() => {
            ask.revert?.();
            setAsk(null);
            focusSel(ask.focus);
          }}
        />
      ) : null}
    </div>
  );
}

/** 열릴 때 안쪽의 sel 첫 요소에 포커스(달력의 고른 날, 맞춤 반복의 단위). */
function AutoFocus({ sel, children }: { sel: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>(sel)?.focus();
  }, [sel]);
  return <div ref={ref}>{children}</div>;
}
