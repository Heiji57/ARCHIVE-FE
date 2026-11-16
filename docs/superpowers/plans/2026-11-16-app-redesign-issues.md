# 앱 리디자인 퍼블리싱: 발견한 문제 기록

계획: `2026-11-16-app-redesign-publishing.md`. Task마다 작업자 보고와 리뷰에서 나온 것을 모은다.
분류: [서버] 서버 변경 필요, [버그] 기존 코드 문제, [시안] 시안 모순이나 빈 곳, [결정] 계획에서 임의로 정한 것.

## 계획 단계

- [결정] 주 시작 요일 기본값은 시안대로 일요일. 서버 설정(03 `week_start`, 제안 기본 `mon`)이 생기면 그 값을 따른다.
- [결정] 처음 화면은 캘린더, 파비콘은 그대로(랜딩과 공유), 미번역 14개 언어는 영어 값.
- [결정] 서버에 없는 기능은 실제 모드에서 숨기고 데모 모드에서만 보인다(`useServerFeature`).
- [기존] `pnpm lint` 기준선 오류 11개(계획 문서 "기준선").

## Task 0 (기반)

- [결정] i18n 모듈 등록은 `modules/index.ts`에 `export { fooI18n } from "./foo";` 한 줄. `I18N_MODULES`와 `ModuleTranslationKey`, `mergeI18nModules`는 `modules/registry.ts`에 둔다(계획은 `index.ts`의 배열). import 한 줄 + 배열 한 줄 대신 한 줄로 끝나고, `index.ts`에서 모듈이 아닌 것을 내보내면 컴파일 에러.
- [결정] 계획 Step 2의 `translate("ja", "test.sample")`은 테스트 키가 실제 `TranslationKey`에 섞이므로, 테스트 전용 모듈로 `mergeI18nModules`를 직접 검사하고, 등록된 실제 모듈은 `translate`로 16개 로케일 전부 검사한다(`modules/index.test.ts`).
- [결정] `isDemoMode()`를 `shared/lib/demoMode.ts`로 옮기고 `app/config/demo.ts`는 다시 내보낸다. `shared/lib/serverFeatures.ts`가 `app`을 import하면 FSD 방향이 거꾸로 된다.
- [결정] 토큰은 계획 목록만이 아니라 최종 화면이 쓰는 시안 CSS 17개(`shared, retro-cards, topicv, ai, aiv, rpanel, settings, sidevar, todomodal, tododetail, newtodo, rest, usermenu, pet, planner, lab3, lab4`)의 `:root` 191개를 이름과 값 그대로 `tokens/redesign.css`에 넣었다. 병렬 작업자가 같은 파일에 토큰을 더하다 충돌하지 않게. 기존 앱 토큰과 이름이 겹치는 것은 `--ink`, `--canvas`(값 같음, 다시 정의 안 함)뿐이라 `--rd-` 접두는 쓰지 않았다.
- [결정] `app/config/demo-redesign`은 app 레이어라 widgets/pages가 직접 import하면 FSD 위반. 지금은 "app 레이어가 읽어서 props/Context로 내려 준다"로 적어 두었다. 위젯이 직접 써야 하면 위치를 `shared/config/demo-redesign` 같은 곳으로 옮길지 정해야 한다(Task 1 전에 결정 필요).
- [시안] 같은 값의 브랜드 색이 두 벌(`--br-gc-*`, `--sv-gc-*`), 위험 색이 여러 벌(`--danger` #d0563f, `--sx-danger`/`--sv-late`/`--td-late` oklch(66% 0.17 30), `--um-danger` #b4432f, `--tm-danger-bg`/`--z-danger-bg`). 시안 그대로 옮겼고 통합 점검(Task 11)에서 줄일 수 있다.
- [시안] `--font`(시안: Pretendard, Inter, system-ui)와 앱 `--font-text`(Pretendard, Inter, -apple-system, ...)의 글꼴 목록이 조금 다르다. 첫 두 글꼴은 같아 화면 차이는 없다.
- [기존] `pnpm build`의 "chunk 500 kB 넘음" 경고는 전부터 있던 것.

## 리뷰 (오케스트레이터)

- [시안] `d-retro2.html?empty=1`이 스크립트 오류(983행, `undefined.date`)로 셸(사이드바, 상단)을 그리지 못하고 빈 화면 문구만 보인다. 앱에서는 셸 안에 빈 화면 한 줄을 넣는다(Task 4).
- [결정] 데모 데이터 위치: 위젯 하나만 쓰는 것은 그 위젯의 `model/demo*.ts`, 여러 위젯이 같이 쓰는 것(캘린더 목록, 커밋, 주제 정리 결과)은 `entities/<entity>/model/demo.ts`. `app/config/demo-redesign`은 Task 1에서 지운다.
