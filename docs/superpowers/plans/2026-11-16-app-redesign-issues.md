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

## Task 1 (앱 셸)

- [결정] 계약에 더한 것(모두 선택 사항, 기존 모양은 계획 그대로): `ShellPage`의 `panelTitle?`(오른쪽 패널 맨 위 날짜 제목), `registerRightRailItem(id, { order, render, visible? })`(Task 8의 "오늘 마무리" 버튼 자리), `useRegisterPaletteCommand(...)`(화면별 팔레트 명령), `registerRightPanelTab`이 해제 함수를 돌려줌, `useShell()`.
- [결정] `SettingsSection` 타입은 `shared/config/settingsSections.ts`에 둔다(app 라우터와 위젯이 같이 씀). `useSettingsSheet`가 다시 내보낸다.
- [결정] `AppRoute`에 "dashboard", "settings"는 남겼다(랜딩의 데모 진입 `hashToRoute`가 "settings"를 씀, 랜딩은 건드리지 않음). `/dashboard`는 주소를 `/`로 바꾸고 캘린더, `/settings#<섹션>`은 캘린더 위에 설정 시트, 시트를 닫으면 `/`.
- [결정] 서버에 AI가 없으면(실제 모드) 상단 "AI" 탭을 숨기고 `/ai`는 캘린더를 보인다.
- [결정] "ai" 탭은 오른쪽 패널 탭 글자 줄에 넣지 않고 오른쪽 줄의 AI 추천 버튼으로만 연다(시안 cal-aip: AI 추천일 때 탭 줄 없음). 등록돼 있고 보일 때만 버튼이 생긴다.
- [결정] 오른쪽 패널 기본 틀로 하루, 시간표(할 일 화면만), 시간 미정, 마감, 커밋(GitHub 연결 때만) 탭 이름을 미리 등록해 두었다. Task 8이 같은 탭을 등록하면 덮어쓴다.
- [결정] 1000px 이하에서 시안은 사이드바를 아예 숨기지만, 그러면 사용자 메뉴(설정, 로그아웃)에 닿을 수 없어 52px 아이콘 레일로 접는다. 오른쪽 패널은 본문 위에 겹쳐 열리고 기본은 닫힘.
- [결정] 접힌 레일 맨 위는 시안의 보라 네모 대신 로고(39번) 표식. 레일의 화면별 아이콘(미니 달력, 캘린더와 태그, 연동)은 페이지 사이드바 내용이라 넣지 않았다.
- [결정] 사용자 메뉴의 "도움말과 의견"(사용법 보기, 의견 보내기, 바뀐 점)은 갈 곳(문서, 엔드포인트)이 없어 뺐다. 데모(로그인 전)는 이름 대신 "게스트", 로그아웃 대신 "로그인".
- [결정] 단축키 창에 시안 목록 중 AI 탭 두 줄(Enter, Shift Enter)은 빼고 사이드바 `[`를 넣었다.
- [결정] 팔레트 명령은 셸이 "새 할 일", "설정 열기"만 등록한다. 시안의 "오늘로 이동, 주간 보기, 월간 보기, 오늘 회고 쓰기, 하루 닫기"는 그 화면 Task(3, 4, 8)가 `useRegisterPaletteCommand`로 올린다. 빗금이에게 묻기 줄은 Task 9.
- [결정] 팔레트에서 할 일을 고르면 지금처럼 `requestFocus` + 캘린더로 간다(Task 2, 3에서 `useTodoEditor().openTodo`로 바꿀 수 있음).
- [결정] 데모 배너는 시안 rest.js(?demo=1)처럼 맨 위 32px 줄(닫기 없음). 기존 배너 CSS(`lp-demo-banner`)는 이미 없어서 화면에 안 보이던 상태였다.
- [결정] 계정 유형 제거: `canUseGithub(github)`는 연결 상태로만 판단. 설정의 GitHub 카드는 이제 항상 보인다(연결하려면 보여야 함). 회고 편집기의 "GitHub 연결하기" 안내는 연결 전에는 안 보인다. `accountType` 데이터 필드와 `setAccountType`, i18n 키는 서버 계약이라 그대로 두었다.
- [결정] 할 일 창(Task 2 전 임시): 기존 TaskDetailPanel을 가운데 `<dialog>`로, 새 할 일은 제목만 받는 작은 창.
- [시안] 375px에서 시안 상단 막대가 글자 단위로 줄바꿈된다(오늘, 탭). 앱은 줄바꿈 없이 도구 막대가 줄고 검색 버튼은 아이콘만.
- [기존] 데모로 처음 들어오면(자동 요약 마지막 확인 기록이 없어) "AI 요약 처리 중" 창이 바로 뜬다. 셸과 무관, 확인 화면은 최소화 후 찍었다.
- [기존] 데모 시작 데이터가 비어 있다(`getInitialAppState`가 데모에서 빈 상태). 확인 화면의 캘린더, 회고, 팔레트가 비어 보이는 이유. 각 Task의 데모 데이터에서 채운다.
- [기존] 옛 셸 CSS(`layout/nav.css`의 global-nav, `widgets/search.css`, 알림 side-panel 일부)는 쓰는 곳이 없어졌지만 지우지 않았다(Task 11 정리).
