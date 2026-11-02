import type { Locale } from "@/app/model/settings";
import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import { fromDateKey, getISOWeek } from "@/shared/lib/date";
import { translate } from "@/shared/lib/i18n";

/**
 * AI 요약(weekly/monthly/yearly)의 표시용 제목을 만든다. 요약 응답엔 원래
 * title 이 없어(또는 서버 기본값이 "{periodStart} ~ {periodEnd}") FE 에서
 * retroType + 기간 시작일(dateKey)로 직접 라벨을 합성한다.
 * `toSummaryEntry`(GET /summaries)와 `toEntry`(isSummary, GET /entries/paginated)
 * 양쪽에서 동일 항목이 같은 제목으로 보이도록 공용으로 쓴다.
 * API 경계(mappers)에는 locale 이 없으므로 화면에서는 `entryDisplayTitle` 로
 * 현재 locale 에 맞춰 다시 합성한다.
 */
export function formatSummaryTitle(
  retroType: RetrospectiveType,
  dateKey: string,
  locale: Locale = "en",
): string {
  const [y, m] = dateKey.split("-");
  switch (retroType) {
    case "weekly": {
      const w = getISOWeek(fromDateKey(dateKey));
      return translate(locale, "retro.summaryTitle.weekly", {
        year: y,
        week: String(w).padStart(2, "0"),
      });
    }
    case "monthly":
      return translate(locale, "retro.summaryTitle.monthly", {
        year: y,
        month: Number(m),
        monthName: fromDateKey(dateKey).toLocaleString(locale, { month: "long" }),
      });
    case "yearly":
      return translate(locale, "retro.summaryTitle.yearly", { year: y });
    default:
      return dateKey;
  }
}

/** 화면 표시용 회고 제목 — AI 요약은 현재 locale 로 합성, 그 외는 저장된 제목 그대로. */
export function entryDisplayTitle(entry: JournalEntry, locale: Locale): string {
  return entry.isSummary
    ? formatSummaryTitle(entry.retroType, entry.dateKey, locale)
    : entry.title;
}
