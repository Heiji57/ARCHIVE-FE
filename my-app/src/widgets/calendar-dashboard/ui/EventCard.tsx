import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useTodayKey } from "@/app/providers/useToday";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { parseTime } from "../model/timeline";
import {
  dueInfo,
  formatClock,
  formatRange,
  isMultiDay,
  monthDay,
  spanHeat,
} from "../model/eventInfo";
import { fmtMonthDayShort } from "../model/dateFormat";
import { STATUS_COLOR, STATUS_KEY, dueText } from "../model/eventLabels";
import { calendarColorVar, useUserCalendars } from "../model/userCalendars";

export interface EventCardProps {
  todo: Todo;
  /**
   * week: 시간 칸 블록(카드 6번 모양, 위치는 layout). allday: 주간 종일 줄의 칩 또는 기간 막대.
   * month: 월간 칸의 한 줄(기간 할 일은 칸마다 조각).
   */
  variant: "week" | "month" | "allday";
  /** AI 추천 같은 흐린 칸(Task 10). 버튼이 아니고 눌리지 않는다. */
  ghost?: boolean;
  /** week: 칸 안의 위치(px)와 겹침 열. */
  layout?: { top: number; height: number; lane?: number; lanes?: number };
  /** allday 기간 막대: 보이는 범위 밖으로 잘린 쪽. */
  cut?: { left: boolean; right: boolean };
  /** month 기간 조각: 시작(s), 중간(m), 마감(e) 칸과 제목 표시 여부. */
  piece?: { pos: "s" | "m" | "e"; label: boolean };
  selected?: boolean;
  dragging?: boolean;
  style?: CSSProperties;
  onOpen?: (id: string) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>, todo: Todo) => void;
  onResizeStart?: (e: PointerEvent<HTMLElement>, todo: Todo) => void;
}

/**
 * 캘린더 할 일 카드(시안 카드 6번: 상태 색 바탕과 왼쪽 띠, 시작 ~ 끝, 태그, 캘린더 색 책갈피).
 * 기간 할 일 막대는 시안 마감 표시 4번(마감 쪽으로 진해지는 바탕, 지나면 빗금).
 */
export function EventCard({
  todo,
  variant,
  ghost = false,
  layout,
  cut,
  piece,
  selected = false,
  dragging = false,
  style,
  onOpen,
  onPointerDown,
  onResizeStart,
}: EventCardProps) {
  const { t, locale } = useTranslation();
  const todayKey = useTodayKey();
  const { calendarOf } = useUserCalendars();
  const cal = ghost ? null : calendarOf(todo);
  const multi = isMultiDay(todo);
  const start = parseTime(todo.startTime);
  const endRaw = parseTime(todo.endTime);
  const end = start !== null ? (endRaw !== null && endRaw > start ? endRaw : start + 60) : null;
  const range = start !== null && end !== null ? formatRange(start, end) : "";
  const dateLabel = fmtMonthDayShort(locale, todo.dateKey);
  const when = multi
    ? t("cal.event.span", { from: monthDay(todo.dateKey), to: monthDay(todo.dueDate!) })
    : start !== null
      ? t("cal.event.timed", { date: dateLabel, range })
      : t("cal.event.allday", { date: dateLabel });
  const aria = t("cal.event.aria", { title: todo.title, when, status: t(STATUS_KEY[todo.status]) });

  const vars = {
    "--tc": STATUS_COLOR[todo.status],
    ...(cal ? { "--cc": calendarColorVar(cal.color) } : {}),
  } as CSSProperties;

  const interactive = !ghost;
  const common = {
    "data-st": todo.status,
    "data-id": todo.id,
    "data-cal": cal ? "" : undefined,
    "data-ghost": ghost ? "" : undefined,
    "data-dragging": dragging ? "" : undefined,
    "aria-current": selected ? (true as const) : undefined,
    ...(interactive
      ? {
          role: "button",
          tabIndex: 0,
          "aria-label": aria,
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen?.(todo.id);
            }
          },
          onPointerDown: onPointerDown ? (e: PointerEvent<HTMLElement>) => onPointerDown(e, todo) : undefined,
        }
      : { "aria-hidden": true as const }),
  };
  const ghostTag = ghost ? <span className="cal-ai">{t("cal.event.ghost")}</span> : null;
  const tags =
    todo.tags.length > 0 ? (
      <span className="cal-tgs">
        {todo.tags.map((tag) => (
          <span key={tag} className="cal-tg">
            {tag}
          </span>
        ))}
      </span>
    ) : null;

  if (variant === "week") {
    const h = layout?.height ?? 40;
    const size = h < 40 ? "xs" : h < 76 ? "sm" : "";
    const lanes = layout?.lanes ?? 1;
    const lane = layout?.lane ?? 0;
    return (
      <div
        {...common}
        className={`cal-ev ${size}`}
        style={{
          ...vars,
          top: layout?.top,
          height: h,
          ...(lanes > 1
            ? { left: `calc(${(lane / lanes) * 100}% + 3px)`, right: "auto", width: `calc(${100 / lanes}% - 6px)` }
            : {}),
          ...style,
        }}
      >
        {ghostTag}
        <span className="cal-ev-t">{todo.title}</span>
        <span className="cal-ev-w">
          {range}
          {size === "sm" && todo.tags.length > 0 ? <span className="cal-ev-wt">{todo.tags.join(" #")}</span> : null}
        </span>
        {todo.description ? <span className="cal-ev-nt">{todo.description}</span> : null}
        {size ? null : tags}
        {interactive && onResizeStart ? (
          <span
            className="cal-ev-rs"
            aria-hidden="true"
            title={t("cal.event.resize")}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, todo);
            }}
          />
        ) : null}
      </div>
    );
  }

  if (variant === "allday") {
    if (multi) {
      const heat = spanHeat(todo, todayKey);
      const d = dueInfo(todo, todayKey);
      const cls = [
        "cal-db",
        heat.late ? "late" : "",
        heat.done ? "fin" : "",
        cut?.left ? "cut-l" : "",
        cut?.right ? "cut-r" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return (
        <div {...common} className={cls} style={{ ...vars, "--hp": `${heat.pct}%`, ...style } as CSSProperties}>
          {ghostTag}
          <span className="cal-db-t">
            {cut?.left ? "‹ " : ""}
            {todo.title}
          </span>
          {cut?.right ? (
            <b className="cal-db-gh" aria-hidden="true">
              ›
            </b>
          ) : (
            <span className="cal-db-r">
              ~{monthDay(todo.dueDate!)} · <b>{dueText(t, d)}</b>
            </span>
          )}
        </div>
      );
    }
    return (
      <div {...common} className="cal-adb" style={{ ...vars, ...style }}>
        {ghostTag}
        <span>{todo.title}</span>
        <em>{t("cal.allday")}</em>
      </div>
    );
  }

  // month
  const kind = multi ? "sp" : start === null ? "ad" : "tm";
  const label = !multi || !piece || piece.label;
  const tm =
    kind === "tm" ? formatClock(start!, true) : kind === "ad" ? t("cal.allday") : piece?.pos === "s" ? t("cal.span") : "";
  return (
    <div
      {...common}
      className={`cal-mi k-${kind}${piece ? ` ${piece.pos}` : ""}`}
      style={{ ...vars, ...style }}
    >
      {ghostTag}
      <span className="cal-mi-tt">{label ? todo.title : ""}</span>
      {tm ? <em className="cal-mi-tm">{tm}</em> : null}
      {piece?.pos === "e" ? <b className="cal-mi-dd">{t("cal.due")}</b> : null}
    </div>
  );
}
