import { useMemo, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import { useTranslation } from "@/shared/lib/i18n";
import { fromDateKey } from "@/shared/lib/date";
import { fmtMonthDayShort, formatKey, useTodoDrag } from "@/widgets/calendar-dashboard";
import { useTodoEditor } from "@/widgets/todo-editor";
import { dueBand, dueTag, nextDay } from "../model/dueBand";
import { PanelRow } from "./PanelRow";

/** 마감 탭 숫자(지난 마감 + 7일 안)와 지난 마감이 있는지. */
// eslint-disable-next-line react-refresh/only-export-components
export function useDueSummary(): { n: number; late: boolean } {
  const { state } = useArchiveApp();
  const today = useTodayKey();
  return useMemo(() => {
    const b = dueBand(state.todos, today);
    return { n: b.reduce((a, d) => a + d.todos.length, 0), late: b[0]?.overdue ?? false };
  }, [state.todos, today]);
}

/**
 * 마감 탭(시안 rpanel.js 마감 2번 일주일 띠): 지남 칸과 오늘부터 7일, 날을 누르면 그날 마감만.
 * 실제 모드는 불러온 범위(state.todos) 안에서만 계산한다. 서버에 지난 마감 조회가 생기면
 * (`overdueQuery`) 지남 칸을 그 결과로 바꾼다.
 */
export function DueTab() {
  const { t, locale } = useTranslation();
  const { state, updateTodo } = useArchiveApp();
  const today = useTodayKey();
  const editor = useTodoEditor();
  const drag = useTodoDrag();
  const [sel, setSel] = useState<string | null>(null);
  const band = useMemo(() => dueBand(state.todos, today), [state.todos, today]);
  const late = band[0]?.overdue ? band[0] : null;
  const all = band.flatMap((d) => d.todos);

  if (!all.length) return <p className="rp-e">{t("todos.rp.dueEmpty")}</p>;

  const shown = sel === "late" ? (late?.todos ?? []) : sel ? (band.find((d) => d.dateKey === sel)?.todos ?? []) : all;
  const sub =
    sel === "late"
      ? t("todos.rp.subLate", { n: shown.length })
      : sel
        ? t("todos.rp.subDay", { date: fmtMonthDayShort(locale, sel), n: shown.length })
        : t("todos.rp.subWeek", { n: shown.length });

  return (
    <>
      <div className="rp-week" role="group" aria-label={t("todos.rp.weekAria")}>
        {band.map((d) => {
          const key = d.dateKey ?? "late";
          const n = d.todos.length;
          const cls = d.overdue ? "late" : d.dateKey === today ? "today" : "";
          return (
            <button
              key={key}
              type="button"
              className={cls}
              aria-pressed={sel === key}
              aria-label={t("todos.rp.dueCellAria", {
                date: d.dateKey ? fmtMonthDayShort(locale, d.dateKey) : t("todos.rp.late"),
                n,
              })}
              onClick={() => setSel((s) => (s === key ? null : key))}
            >
              <small>{d.dateKey ? formatKey(locale, d.dateKey, { weekday: "short" }) : t("todos.rp.late")}</small>
              <b>{d.dateKey ? fromDateKey(d.dateKey).getDate() : n}</b>
              <span aria-hidden="true">
                {Array.from({ length: Math.min(n, 3) }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="rp-sub">{sub}</p>
      <div className="rp-list">
        {shown.length ? (
          shown.map((x) => {
            const tag = dueTag(x.dueDate!, today);
            return (
              <PanelRow
                key={x.id}
                todo={x}
                right={tag.label}
                whenText={tag.label}
                tone={tag.tone}
                onOpen={editor.openTodo}
                onPointerDown={drag.startMove}
              >
                <button
                  type="button"
                  className="rp-a"
                  aria-label={t("todos.rp.plus1Aria", { title: x.title })}
                  onClick={() => updateTodo(x.id, { dueDate: nextDay(x.dueDate!) })}
                >
                  {t("todos.rp.plus1")}
                </button>
              </PanelRow>
            );
          })
        ) : (
          <p className="rp-e">{t("todos.rp.dueDayEmpty")}</p>
        )}
      </div>
    </>
  );
}
