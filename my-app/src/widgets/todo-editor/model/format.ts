import type { Locale } from "@/app/model/settings";
import type { TaskStatus, Todo } from "@/entities/todo/model/types";
import { monthDayLabel } from "@/entities/todo/lib/recurrence";
import { fromDateKey } from "@/shared/lib/date";
import type { TranslateFn } from "@/shared/lib/i18n";
import { daysBetween, fromMinutes, toMinutes } from "./dates";

/** 할 일 창의 값 글자(시안 형식: "11월 3일 (화)", "오후 4시 ~ 오후 5시"). */

export function weekdayShort(dateKey: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(fromDateKey(dateKey));
}

/** "11월 3일 (화)" */
export function dateLabel(dateKey: string, locale: Locale): string {
  return `${monthDayLabel(dateKey, locale)} (${weekdayShort(dateKey, locale)})`;
}

/** "오후 4시", "오후 4:30" */
export function timeLabel(hm: string, locale: Locale): string {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(2024, 0, 1, h, m);
  return new Intl.DateTimeFormat(locale, m ? { hour: "numeric", minute: "2-digit" } : { hour: "numeric" }).format(d);
}

/** 끝이 없으면 시작 + 1시간(일간 보기의 블록과 같게). */
export function timeRangeLabel(
  todo: { startTime?: string | null; endTime?: string | null },
  t: TranslateFn,
  locale: Locale,
): string {
  if (!todo.startTime) return "";
  const end = todo.endTime ?? fromMinutes(toMinutes(todo.startTime) + 60);
  return t("todoEditor.timeRange", { start: timeLabel(todo.startTime, locale), end: timeLabel(end, locale) });
}

export type DueTone = "late" | "soon" | "";

/** 마감까지 남은 날: "3일 남음", "내일", "오늘", "2일 지남". */
export function dueRelative(due: string, today: string, t: TranslateFn): { text: string; tone: DueTone } {
  const n = daysBetween(today, due);
  if (n < 0) return { text: t("todoEditor.due.late", { n: -n }), tone: "late" };
  if (n === 0) return { text: t("todoEditor.due.today"), tone: "soon" };
  if (n === 1) return { text: t("todoEditor.due.tomorrow"), tone: "soon" };
  return { text: t("todoEditor.due.left", { n }), tone: "" };
}

export const STATUS_ORDER: TaskStatus[] = ["not-start", "in-progress", "done"];

export function statusLabel(status: TaskStatus, t: TranslateFn): string {
  return t(
    status === "done"
      ? "todoEditor.status.done"
      : status === "in-progress"
        ? "todoEditor.status.inProgress"
        : "todoEditor.status.notStart",
  );
}

export function tagsLabel(tags: string[]): string {
  return tags.map((x) => `#${x}`).join(" ");
}

/** "오늘", "내일", "모레" 가 붙는 날이면 그 말, 아니면 null. */
export function relativeDayWord(dateKey: string, today: string, t: TranslateFn): string | null {
  const n = daysBetween(today, dateKey);
  if (n === 0) return t("todoEditor.quick.today");
  if (n === 1) return t("todoEditor.quick.tomorrow");
  if (n === 2) return t("todoEditor.quick.dayAfter");
  return null;
}

export type GoogleState = "none" | "reauth" | NonNullable<Todo["calendarPushStatus"]>;

/** Google 캘린더 줄의 상태. 연결 전("disconnected" 등)은 none. */
export function googleState(todo: Todo, calendarStatus: string): GoogleState {
  if (calendarStatus === "needs-reauth") return "reauth";
  if (calendarStatus !== "connected") return "none";
  if (todo.calendarPushStatus) return todo.calendarPushStatus;
  return todo.calendarLinked ? "synced" : "none";
}

export function googleLabel(state: GoogleState, t: TranslateFn): string {
  switch (state) {
    case "none":
      return "";
    case "reauth":
      return t("todoEditor.g.reauth");
    case "pending":
      return t("todoEditor.g.pending");
    case "syncing":
      return t("todoEditor.g.syncing");
    case "synced":
      return t("todoEditor.g.synced");
    case "failed":
      return t("todoEditor.g.failed");
    case "pending_delete":
      return t("todoEditor.g.pendingDelete");
  }
}
