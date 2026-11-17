/**
 * i18n 모듈 등록. 모듈마다 아래에 한 줄 `export { fooI18n } from "./foo";` 를 추가한다.
 * 병렬 작업의 merge 충돌을 줄이려고 파일 이름 알파벳 순으로 넣는다.
 * 여기서 export 한 것은 전부 I18nModule 이어야 한다(registry.ts 가 컴파일 단계에서 확인).
 */
export { authI18n } from "./auth";
export { calendarI18n } from "./calendar";
export { shellI18n } from "./shell";
export { todoEditorI18n } from "./todoEditor";
export { topicI18n } from "./topic";
