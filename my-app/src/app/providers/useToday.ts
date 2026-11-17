import { useEffect, useState } from "react";
import { DEMO_ANCHOR_DATE_KEY, DEMO_NOW_MINUTES } from "@/app/config/demo";
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

const clockMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

/**
 * 지금 시각(자정 기준 분). 1분마다 갱신. 데모 모드는 시안과 같은 고정 시각(오후 2시 20분).
 * 캘린더 지금 선, 오른쪽 패널 하루 탭이 쓴다.
 */
export function useNowMinutes(): number {
  const { isDemo } = useArchiveApp();
  const [now, setNow] = useState(clockMinutes);
  useEffect(() => {
    if (isDemo) return;
    const id = window.setInterval(() => setNow(clockMinutes()), 60_000);
    return () => window.clearInterval(id);
  }, [isDemo]);
  return isDemo ? DEMO_NOW_MINUTES : now;
}
