import { fromDateKey } from "@/shared/lib/date"

/**
 * 데모 시드 데이터가 정렬되어 있는 기준 날짜.
 * 캘린더 초기 cursor 위치와 "오늘" 강조 표시에 사용됩니다.
 * 시드 데이터(`app/config/seed/*.ts`)를 갱신하는 경우 함께 갱신하세요. 시안(prototypes/linear-shell)과 같은 2026-11-03(화).
 */
// toDateKey() 는 항상 zero-padded("YYYY-MM-DD") 를 생성하므로 앵커도 동일 형식이어야
// 캘린더 셀 키("오늘" 강조)·신규 todo dateKey 매칭이 어긋나지 않는다.
export const DEMO_ANCHOR_DATE_KEY = "2026-11-03"
export const DEMO_ANCHOR_DATE = fromDateKey(DEMO_ANCHOR_DATE_KEY)

/** 데모의 "지금" 시각(자정 기준 분). 시안과 같은 오후 2시 20분. 캘린더 지금 선과 오른쪽 패널 하루 탭이 쓴다. */
export const DEMO_NOW_MINUTES = 14 * 60 + 20

// isDemoMode 는 shared 레이어(useServerFeature 등)에서도 써야 해서 shared/lib 로 옮겼다.
// 기존 import 경로(@/app/config/demo)는 그대로 쓸 수 있게 다시 내보낸다.
export { isDemoMode } from "@/shared/lib/demoMode"
