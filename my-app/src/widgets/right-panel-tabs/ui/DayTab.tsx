import { useMemo } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useNowMinutes, useTodayKey } from "@/app/providers/useToday";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { formatRange, useTodoDrag } from "@/widgets/calendar-dashboard";
import { useTodoEditor } from "@/widgets/todo-editor";
import { dayProgress, spanOf } from "../model/dayProgress";
import { spokenDuration, spokenTime } from "../model/format";
import { usePanelDate } from "../model/panelDate";
import { PanelRow } from "./PanelRow";

/** 하루 탭(시안 rpanel.js 하루 2번 "지금과 다음"): 지금 하는 일과 진행, 다음 일까지 남은 시간, 그 밖의 남은 일. */
export function DayTab() {
  const { t, locale } = useTranslation();
  const { state } = useArchiveApp();
  const date = usePanelDate();
  const today = useTodayKey();
  const now = useNowMinutes();
  const editor = useTodoEditor();
  const drag = useTodoDrag();
  const dayTodos = useMemo(() => state.todos.filter((x) => x.dateKey === date), [state.todos, date]);
  const p = dayProgress(dayTodos, date === today ? now : null);

  if (!p.total) return <p className="rp-e">{t("todos.rp.dayEmpty")}</p>;

  const range = (x: Todo) => {
    const s = spanOf(x);
    return s ? formatRange(s.start, s.end) : "";
  };
  const cur = p.current ? spanOf(p.current) : null;
  const pct = cur ? Math.min(100, ((now - cur.start) / (cur.end - cur.start)) * 100) : 0;

  return (
    <>
      {p.current ? (
        <button type="button" className="rp-now" onClick={() => editor.openTodo(p.current!.id)}>
          <span className="rp-k">{t("todos.rp.now")}</span>
          <b>{p.current.title}</b>
          <span className="rp-m">{range(p.current)}</span>
          <span className="rp-bar" aria-hidden="true">
            <i style={{ width: `${pct}%` }} />
          </span>
        </button>
      ) : (
        <div className="rp-now quiet">
          <span className="rp-k">{t("todos.rp.now")}</span>
          <span className="rp-m">{t("todos.rp.nowEmpty")}</span>
        </div>
      )}
      {p.next ? (
        <button type="button" className="rp-next" onClick={() => editor.openTodo(p.next!.id)}>
          <span className="rp-k">
            {p.nextInMin !== null
              ? t("todos.rp.nextIn", { d: spokenDuration(t, p.nextInMin) })
              : t("todos.rp.next")}
          </span>
          <b>{p.next.title}</b>
          <span className="rp-m">{range(p.next)}</span>
        </button>
      ) : null}
      <p className="rp-sub">{t("todos.rp.others", { n: p.rest.length })}</p>
      <div className="rp-list">
        {p.rest.map((x) => {
          const s = spanOf(x);
          return (
            <PanelRow
              key={x.id}
              todo={x}
              right={s ? spokenTime(locale, s.start) : t("todos.rp.noTime")}
              whenText={s ? spokenTime(locale, s.start) : t("todos.rp.noTime")}
              onOpen={editor.openTodo}
              onPointerDown={drag.startMove}
            />
          );
        })}
      </div>
    </>
  );
}
