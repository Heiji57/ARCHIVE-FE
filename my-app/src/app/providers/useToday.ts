import { DEMO_ANCHOR_DATE_KEY } from "@/app/config/demo";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { todayKeyInTz } from "@/shared/lib/date";

/**
 * 현재 사용자 기준 "오늘"의 dateKey.
 *  - 데모 모드: 시드 데이터가 정렬된 앵커 날짜
 *  - 실제 사용자: user.timezone 기준 오늘 (브라우저 로컬 아님)
 */
export function useTodayKey(): string {
  const { state, isDemo } = useArchiveApp();
  if (isDemo) return DEMO_ANCHOR_DATE_KEY;
  return todayKeyInTz(state.currentUser?.timezone ?? undefined);
}
