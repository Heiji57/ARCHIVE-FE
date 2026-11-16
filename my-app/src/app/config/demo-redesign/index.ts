/**
 * 리디자인 데모 전용 데이터 모음 (`?demo=true` 에서만 쓴다).
 *
 * 서버(api.yaml)에 아직 없는 기능(useServerFeature 가 실제 모드에서 false 인 것)을
 * 데모 모드에서 보여 주기 위한 데이터를 여기에 모은다. 실제 모드에서는 읽지 않는다.
 *
 * 형식(이후 Task 가 추가):
 *   - 기능마다 파일 하나: `./<기능>.ts` 에 `export const demo<Name>: <Type> = ...`
 *     예) calendars.ts → demoCalendars, commits.ts → demoCommits,
 *         topicStructured.ts → demoTopicStructured, ai.ts → demoAiRuns, demoAiSuggestions ...
 *   - 이 파일에는 한 줄 `export { demoX } from "./x";` 로 등록한다(알파벳 순, merge 충돌 줄이기).
 *   - 타입은 entities/* 의 도메인 타입(camelCase)을 쓴다. 서버 응답 모양(snake_case)을 흉내 내지 않는다.
 *   - 날짜는 DEMO_ANCHOR_DATE_KEY(`@/app/config/demo`, 2026-06-15) 기준으로 만든다.
 *   - 문구는 데이터(사용자가 쓴 글)만 넣는다. UI 문구는 i18n 모듈(`@/shared/lib/i18n/modules`).
 *
 * 주의(FSD): app 레이어라 widgets/pages 에서 직접 import 하면 안 된다(app → pages → widgets 방향).
 * app 레이어(AppProvider, 라우트 조립, 셸)가 읽어서 props 나 Context 로 내려 준다.
 */
export {};
