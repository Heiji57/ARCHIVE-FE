import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { Locale } from "@/app/model/settings";
import {
  endOfISOWeek,
  formatMonthLabel,
  fromDateKey,
  startOfISOWeek,
} from "@/shared/lib/date";

const LOCALE_TAG: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
};

/**
 * 갤러리 카드의 날짜 라벨을 회고 종류에 맞춰 만든다 (표시 전용).
 *  - daily   : 단일 날짜 (예: "6월 11일" / "Jun 11")
 *  - weekly  : 해당 ISO 주 범위 (예: "6월 8일 – 14일" / "Jun 8 – 14")
 *  - monthly : 해당 달 (예: "2026년 5월" / "May 2026")
 *  - yearly  : 해당 연도 (예: "2026")
 *
 * 요약(weekly/monthly/yearly)의 dateKey 는 기간의 마지막 날(anchor)이지만
 * ISO 주/달 경계 계산은 그 날짜가 속한 주/달을 정확히 되돌려주므로 문제없다.
 */
export function formatEntryDateRange(
  retroType: RetrospectiveType,
  dateKey: string,
  locale: Locale,
): string {
  const tag = LOCALE_TAG[locale];
  const date = fromDateKey(dateKey);

  switch (retroType) {
    case "weekly": {
      const start = startOfISOWeek(date);
      const end = endOfISOWeek(date);
      const startLabel = new Intl.DateTimeFormat(tag, {
        month: "short",
        day: "numeric",
      }).format(start);
      // 같은 달이면 끝은 일(day)만 표기: "Jun 8 – 14"
      const sameMonth = start.getMonth() === end.getMonth();
      const endLabel = new Intl.DateTimeFormat(
        tag,
        sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" },
      ).format(end);
      return `${startLabel} – ${endLabel}`;
    }
    case "monthly":
      return formatMonthLabel(date, locale);
    case "yearly":
      return `${date.getFullYear()}`;
    case "daily":
    default:
      return new Intl.DateTimeFormat(tag, {
        month: "short",
        day: "numeric",
      }).format(date);
  }
}
