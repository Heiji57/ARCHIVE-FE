import type { RetrospectiveType } from "@/entities/entry/model/types";
import { fromDateKey, getISOWeek } from "@/shared/lib/date";

/**
 * AI 요약(weekly/monthly/yearly)의 표시용 제목을 만든다. 요약 응답엔 원래
 * title 이 없어(또는 서버 기본값이 "{periodStart} ~ {periodEnd}") FE 에서
 * retroType + 기간 시작일(dateKey)로 직접 라벨을 합성한다.
 * `toSummaryEntry`(GET /summaries)와 `toEntry`(isSummary, GET /entries/paginated)
 * 양쪽에서 동일 항목이 같은 제목으로 보이도록 공용으로 쓴다.
 */
export function formatSummaryTitle(
  retroType: RetrospectiveType,
  dateKey: string,
): string {
  const [y, m] = dateKey.split("-");
  switch (retroType) {
    case "weekly": {
      const w = getISOWeek(fromDateKey(dateKey));
      return `${y}-W${String(w).padStart(2, "0")} 주간 회고`;
    }
    case "monthly":
      return `${y}년 ${Number(m)}월 월간 회고`;
    case "yearly":
      return `${y}년 연간 회고`;
    default:
      return dateKey;
  }
}
