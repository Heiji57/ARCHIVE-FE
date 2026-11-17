/** 주제 화면의 날짜, 제목 글자. 시안 md2, weekOf, titleOf. */
import type { Locale } from "@/app/model/settings";
import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { TaskStatus } from "@/entities/todo/model/types";
import type { TranslateFn } from "@/shared/lib/i18n/context";
import { LOCALE_TAG } from "@/shared/lib/date";

/** "2026-11-03" → "11/3" */
export const md2 = (k: string) => `${+k.slice(5, 7)}/${+k.slice(8, 10)}`;

/** 기간 글자: 하루면 "11/3", 아니면 "10/20 – 11/2" */
export const spanText = (span: readonly [string, string] | null) =>
  !span ? "" : span[0] === span[1] ? md2(span[0]) : `${md2(span[0])} – ${md2(span[1])}`;

/** 그달 몇째 주(일요일 시작). 시안 weekOf */
export const weekOfMonth = (k: string) => {
  const y = +k.slice(0, 4);
  const m = +k.slice(5, 7) - 1;
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay();
  return Math.ceil((+k.slice(8, 10) + first) / 7);
};

/** 요일 이름(ko "화요일", en "Tuesday") */
export const weekdayName = (k: string, locale: Locale) =>
  new Intl.DateTimeFormat(LOCALE_TAG[locale], { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10))),
  );

/** 제목 없는 회고의 기본 제목 */
export function entryTitle(
  t: TranslateFn,
  e: { title: string; retroType: RetrospectiveType; dateKey: string },
): string {
  if (e.title) return e.title;
  const m = +e.dateKey.slice(5, 7);
  const d = +e.dateKey.slice(8, 10);
  const y = e.dateKey.slice(0, 4);
  if (e.retroType === "weekly") return t("topic.v.entryTitle.weekly", { m, w: weekOfMonth(e.dateKey) });
  if (e.retroType === "monthly") return t("topic.v.entryTitle.monthly", { m });
  if (e.retroType === "yearly") return t("topic.v.entryTitle.yearly", { y });
  return t("topic.v.entryTitle.daily", { m, d });
}

/** 할 일 상태 글자 */
export const todoStatusText = (t: TranslateFn, st: TaskStatus) =>
  st === "done" ? t("topic.v.todo.done") : st === "in-progress" ? t("topic.v.todo.doing") : t("topic.v.todo.open");

/** 종류 아이콘 class (k-done, k-doing, k-open) */
export const todoKindClass = (st: TaskStatus) =>
  st === "done" ? "k-done" : st === "in-progress" ? "k-doing" : "k-open";

/** markdown 을 한 줄 글로(인용 줄용). 제목 줄은 뺀다 */
export function plainText(md: string): string {
  return md
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.replace(/^[-*]\s+/, "").replace(/`([^`]*)`/g, "$1"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 종류 아이콘 이름 */
export const todoKind = (st: TaskStatus): "done" | "doing" | "open" =>
  st === "done" ? "done" : st === "in-progress" ? "doing" : "open";
