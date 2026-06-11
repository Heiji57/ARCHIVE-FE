import { fromDateKey } from "@/shared/lib/date"

/**
 * 데모 시드 데이터가 정렬되어 있는 기준 날짜.
 * 캘린더 초기 cursor 위치와 "오늘" 강조 표시에 사용됩니다.
 * 시드 데이터(`app/config/seedState.ts`)를 갱신하는 경우 함께 갱신하세요.
 */
// toDateKey() 는 항상 zero-padded("YYYY-MM-DD") 를 생성하므로 앵커도 동일 형식이어야
// 캘린더 셀 키("오늘" 강조)·신규 todo dateKey 매칭이 어긋나지 않는다.
export const DEMO_ANCHOR_DATE_KEY = "2026-06-15"
export const DEMO_ANCHOR_DATE = fromDateKey(DEMO_ANCHOR_DATE_KEY)
