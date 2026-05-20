import { fromDateKey } from "@/shared/lib/date";

/**
 * 데모 시드 데이터가 정렬되어 있는 기준 날짜.
 * 캘린더 초기 cursor 위치와 "오늘" 강조 표시에 사용됩니다.
 * 시드 데이터(`app/config/seedState.ts`)를 갱신하는 경우 함께 갱신하세요.
 */
export const DEMO_ANCHOR_DATE_KEY = "2023-10-25";
export const DEMO_ANCHOR_DATE = fromDateKey(DEMO_ANCHOR_DATE_KEY);
