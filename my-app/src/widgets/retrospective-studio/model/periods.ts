/**
 * 요약(주간/월간/연간) 기간 선택 옵션 빌더.
 *
 * 서버 계약(`POST /summaries/generate`)의 periodStart 규칙과 정합:
 *  - weekly  : 해당 주 **월요일** (ISO 8601)
 *  - monthly : 해당 달 **1일**
 *  - yearly  : 해당 해 **1월 1일**
 *
 * periodEnd 는 FE 의 "이미 존재하는 회고록" 존재 확인(GET /entries) 범위로 사용한다.
 */
import type { SummaryKind } from "@/entities/summary/model/types";
import {
  addDays,
  endOfISOWeek,
  endOfMonth,
  endOfYear,
  getISOWeek,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
  toDateKey,
} from "@/shared/lib/date";

export interface PeriodOption {
  /** 서버에 전달할 periodStart dateKey (월요일/1일/1월1일). */
  periodStart: string;
  /** 존재 확인용 periodEnd dateKey (일요일/말일/12월31일). */
  periodEnd: string;
  /** 기간 시작 Date (라벨 포맷용). */
  startDate: Date;
  /** 기간 끝 Date (라벨 포맷용). */
  endDate: Date;
}

/** 주간 옵션 개수 (현재 주 포함, 과거로 N주). */
const WEEKLY_COUNT = 8;
/** 월간 옵션 개수. */
const MONTHLY_COUNT = 12;
/** 연간 옵션 개수. */
const YEARLY_COUNT = 5;

/**
 * 오늘(today) 기준으로 kind 에 맞는 최근 기간 옵션 목록을 만든다.
 * index 0 = 가장 최근(현재 진행 중 포함), 이후 과거로 내려간다.
 */
export function buildPeriodOptions(
  kind: SummaryKind,
  today: Date,
): PeriodOption[] {
  switch (kind) {
    case "weekly": {
      const thisMonday = startOfISOWeek(today);
      return Array.from({ length: WEEKLY_COUNT }, (_, i) => {
        const start = addDays(thisMonday, -7 * i);
        const end = endOfISOWeek(start);
        return {
          periodStart: toDateKey(start),
          periodEnd: toDateKey(end),
          startDate: start,
          endDate: end,
        };
      });
    }
    case "monthly": {
      const thisMonthStart = startOfMonth(today);
      return Array.from({ length: MONTHLY_COUNT }, (_, i) => {
        const start = new Date(
          thisMonthStart.getFullYear(),
          thisMonthStart.getMonth() - i,
          1,
          12,
        );
        const end = endOfMonth(start);
        return {
          periodStart: toDateKey(start),
          periodEnd: toDateKey(end),
          startDate: start,
          endDate: end,
        };
      });
    }
    case "yearly": {
      const thisYear = today.getFullYear();
      return Array.from({ length: YEARLY_COUNT }, (_, i) => {
        const start = startOfYear(new Date(thisYear - i, 0, 1, 12));
        const end = endOfYear(start);
        return {
          periodStart: toDateKey(start),
          periodEnd: toDateKey(end),
          startDate: start,
          endDate: end,
        };
      });
    }
  }
}

/** weekly 옵션의 ISO 주차 (라벨 "n주차" 표기에 사용). */
export function isoWeekOf(date: Date): number {
  return getISOWeek(date);
}
