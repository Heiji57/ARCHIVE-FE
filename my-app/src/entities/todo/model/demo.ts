/**
 * 데모 모드 태그 순서(시안 shared.js A.TAG + planner.js 의 리뷰, 버그). 태그 순서와 색을 서버가
 * 아직 저장하지 않으므로(`useServerFeature("tagAdmin")`) 데모 모드에서만 이 순서를 쓴다.
 */
export const DEMO_TAG_ORDER: readonly string[] = ["업무", "사이드", "학습", "리뷰", "버그"];
