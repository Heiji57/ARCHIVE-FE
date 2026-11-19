import type { CSSProperties, PointerEvent } from "react";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import {
  STATUS_COLOR,
  STATUS_KEY,
  calendarColorVar,
  daysBetween,
  durationLabel,
  fmtMonthDayShort,
  formatRange,
  isMultiDay,
  monthDay,
  spanHeat,
  useUserCalendars,
} from "@/widgets/calendar-dashboard";
import { minutes } from "../model/sortDay";

export interface BoardCardProps {
  todo: Todo;
  todayKey: string;
  dragging: boolean;
  onOpen(id: string): void;
  onPointerDown(e: PointerEvent<HTMLElement>, todo: Todo): void;
}

/**
 * 보드 카드(시안 카드 6번 목록 모양): 상태 색 바탕과 왼쪽 띠, 시간과 길이, 태그, 캘린더 색 책갈피.
 * 기간 할 일은 시안 마감 표시 4번(마감 쪽으로 진해지는 바탕, 오늘 선, "마감까지 N일").
 */
export function BoardCard({ todo, todayKey, dragging, onOpen, onPointerDown }: BoardCardProps) {
  const { t, locale } = useTranslation();
  const { calendarOf } = useUserCalendars();
  const cal = calendarOf(todo);
  const multi = isMultiDay(todo);
  const s = minutes(todo.startTime);
  const eRaw = minutes(todo.endTime);
  const e = s !== null ? (eRaw !== null && eRaw > s ? eRaw : s + 60) : null;

  const vars: Record<string, string> = { "--tc": STATUS_COLOR[todo.status] };
  if (cal) vars["--cc"] = calendarColorVar(cal.color);

  let when: string;
  let len = "";
  let tdy = false;
  let hl = "";
  let cls = "bd-c";
  if (multi) {
    const n = daysBetween(todo.dateKey, todo.dueDate!) + 1;
    const k = daysBetween(todo.dateKey, todayKey);
    const left = daysBetween(todayKey, todo.dueDate!);
    const heat = spanHeat(todo, todayKey);
    vars["--p"] = `${Math.min(Math.max((k + 0.5) / n, 0), 1) * 100}%`;
    vars["--hp"] = `${heat.pct}%`;
    cls += ` sp${heat.late ? " late" : ""}${heat.done ? " fin" : ""}`;
    when = `${monthDay(todo.dateKey)} ~ ${monthDay(todo.dueDate!)}`;
    len = t("todos.board.days", { n });
    tdy = todo.status !== "done" && k >= 0 && left >= 0;
    hl =
      todo.status === "done"
        ? t("todos.board.dueDone")
        : left < 0
          ? t("todos.board.dueLate", { n: -left })
          : left === 0
            ? t("todos.board.dueToday")
            : t("todos.board.dueLeft", { n: left });
  } else if (s !== null && e !== null) {
    when = formatRange(s, e);
    len = durationLabel(e - s);
  } else {
    when = `${monthDay(todo.dateKey)} ${t("cal.allday")}`;
  }

  const aria = t("cal.event.aria", {
    title: todo.title,
    when: multi ? when : `${fmtMonthDayShort(locale, todo.dateKey)} ${when}`,
    status: t(STATUS_KEY[todo.status]),
  });

  return (
    <div
      className={cls}
      role="button"
      tabIndex={0}
      aria-label={aria}
      data-id={todo.id}
      data-st={todo.status}
      data-cal={cal ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      style={vars as CSSProperties}
      onPointerDown={(ev) => onPointerDown(ev, todo)}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onOpen(todo.id);
        }
      }}
    >
      {tdy ? <i className="bd-tdy" aria-hidden="true" /> : null}
      <span className="bd-t">{todo.title}</span>
      <span className="bd-w">
        <span>{when}</span>
        {len ? <em>{len}</em> : null}
        {hl ? <span className="bd-hl">{hl}</span> : null}
      </span>
      {todo.tags.length ? (
        <span className="cal-tgs">
          {todo.tags.map((tag) => (
            <span key={tag} className="cal-tg">
              {tag}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}
