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

## Task 7 (로그인과 가입)

- [결정] 로고 표식(39번 둥근 날개)은 Task 1의 `AppLogo`가 아직 없어 `widgets/auth/ui/AuthParts.tsx`의 `AuthBrand`에 따로 그렸다. Task 1이 합쳐지면 `AppLogo`로 바꾼다(통합 점검 Task 11).
- [결정] Google 로고 네 색은 시안 `d-auth.html`의 `:root`(`--au-g-b/g/y/r`)를 `tokens/redesign.css` 끝에 새 묶음으로 넣었다(README 표에는 아직 안 적음).
- [결정] 인증 코드는 시안처럼 6칸이지만 서버 코드가 영숫자 6자(예: PW1YOT)라 숫자 키패드(`inputmode=numeric`)를 쓰지 않고, 칸 읽기 이름도 "n번째 숫자" 대신 "n번째 글자". 붙여넣기와 `one-time-code` 자동 완성은 칸을 차례로 채운다(`model/code.ts`, 테스트 있음).
- [결정] 가입 프로필 단계에 시안에 없는 "로그인 상태 유지" 스위치를 남겼다(기존 동작, 기본 켬). 가입 2, 3단계에도 "이미 계정이 있으신가요? 로그인"을 남겼다(시안은 1단계만). 이동 경로를 줄이지 않으려고.
- [결정] 비밀번호 찾기 발송 후 문구는 시안("you@example.com으로 보냈어요")이 아니라 기존 `auth.forgot.linkSent`("가입되어 있다면 보냈습니다")를 쓴다. 가입 여부를 드러내지 않는 기존 보안 방침. 시안의 "메일의 링크 열기 (시안)" 버튼은 옮기지 않았다.
- [결정] 재설정 링크 만료(`token-expired`)는 시안의 "링크가 만료됐어요" 화면 대신 기존처럼 폼 위 오류 문구로 보인다(오류 코드 → 문구 매핑 유지). 토큰 없이 들어오면 제목 + 오류 + "재설정 링크 다시 받기" 버튼.
- [결정] 오류는 시안의 `.er` 상자(폼 위)로 모았다. 비밀번호 확인 불일치만 칸 아래에 둔다. 비밀번호 칸의 보기 버튼(기존)은 남겼다.
- [결정] mock 모드(`VITE_USE_API` 아님)의 콘솔 안내 상자는 시안에 없지만 남겼다(실제 모드에서는 안 보임).
- [결정] 시안 글자 크기(라벨·링크 13px, 입력·버튼 14px, 제목 24px)를 따랐다. CLAUDE.md 10장(12/16/18) 밖의 값.
- [버그] 기존 `auth.forgot.subtitle`("인증 코드를 보내드려요")와 영어 `auth.forgot.emailSubmit`("Send reset code")가 링크 방식과 맞지 않았다. 새 키 `auth.forgot.lead`, `auth.forgot.sendLink`로 바꿔 쓰고 옛 키는 남겼다(Task 11 정리 대상: `auth.forgot.subtitle`, `auth.forgot.emailSubmit`, `auth.forgot.codeSubmit`, `auth.forgot.newPasswordSubmit`, `auth.forgot.success`, `auth.signup.subtitle`, `auth.onboarding.subtitle`, `auth.reset.success`).
- [버그] 기존 OAuth 버튼의 로딩 아이콘 `className="spin"`은 CSS가 없어 돌지 않았다. `auth-spin`으로 바꿨다.
- [결정] `auth.css`의 계정 유형 카드(`actype-*`)와 `.auth-secondary`는 `AccountTypeForm`이 아직 쓰므로 남겼다. Task 1이 그 화면을 지울 때 함께 지운다.
- [시안] 시안 로그인 화면의 로고는 링크(`d-auth.html`)지만 앱에서는 이동을 새로 만들지 않으려고 링크 없이 둔다.
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

## Task 2 (할 일 모달 26, 새 할 일 창 3)

- [서버] `PATCH /todos/{id}`의 `recurrence_scope`는 `this | following` 뿐이라 "모든 반복 일정"(all)을 직접 보낼 수 없다. 지금은 시리즈 base(첫 회차) id에 `following`으로 보낸다(`toEditorCalls`). base에 following을 보낼 때 서버가 시리즈 전체(이미 있는 예외 회차 포함)를 바꾸는지 확인이 필요하고, 안 되면 `recurrence_scope: all`을 추가해야 한다. 시간 변경(all)은 base가 목록에 없으면 `updateTodoTimeRecurrence`가 날짜를 몰라 보내지 않는다.
- [결정] 범위 계산은 `widgets/todo-editor/model/applyScope.ts`: `applyScope(series, instanceDateKey, patch, scope)` → `ScopedChange[]`(this=회차 하나, following=전날까지 끊고 그날부터 새 시리즈, all=시리즈 자체, 첫날의 following=all), `toEditorCalls(changes, ctx)` → `useArchiveApp()` 액션 호출 목록. 반복 규칙 변경은 시안처럼 묻지 않고 "이 일정부터 이후 전체"(가상 회차) 또는 반복 전환.
- [결정] 데모/mock은 반복을 펼치지 않아 보이는 한 건이 시리즈 전체다. 범위와 상관없이 그 한 건을 로컬에서 고친다. 데모에서 반복을 만들 수 있게 `AppProvider`의 `convertTodoToRecurring`/`updateTodoRecurrence` 데모 분기가 로컬 한 건에 규칙만 적는다(`setLocalRecurrence`, 새 상태 없음). 전에는 아무것도 안 했다.
- [결정] 반복 변경(following/all) 뒤 실제 모드는 응답의 새 base로 모달을 옮긴다(같은 날짜 회차가 목록에 있으면 그 회차). 보이는 범위 재조회는 화면(Task 3, 8)이 한다. 모달이 범위를 모르기 때문.
- [결정] 할 일 창은 `App.tsx`에서 `AppShell` 안(`TodoEditorHost`)으로 옮겼다. Google 캘린더 줄의 "설정에서 연결"이 `useSettingsSheet().open("link")`을 부르려고. `TodoEditorProvider` props: `calendars?`, `calendarOf?`, `onCalendarChange?`, `onOpenSettings?`.
- [결정] 사용자 캘린더 목록은 Task 3 전 임시로 위젯 안 `FALLBACK_CALENDARS`(개인, ARCHIVE 팀, 스터디)와 임시 색 토큰 `--te-cal-me/team/study`(`widgets/todo-editor.css`의 `:root`). 할 일마다 고른 캘린더는 위젯 안에만 기억한다(서버 필드 없음). Task 3이 `entities/calendar/model/demo.ts`를 만들면 `TodoEditorHost`에서 `calendars`, `calendarOf`, `onCalendarChange`로 넘기고 임시 목록과 색 토큰을 지운다.
- [결정] Google 캘린더 줄은 시안처럼 늘 있고(값이 없으면 빈 속성), 연결 전이면 메뉴에 "설정에서 연결", 다시 연결 필요면 "설정에서 다시 연결", 연결돼 있으면 추가/다시 보내기/빼기(`toggleTodoCalendarLink`).
- [결정] 새 할 일 창의 값 메뉴는 26번과 같은 찾기 메뉴(찾기 칸 + 목록)를 쓴다. 시안 3번의 "다른 날" 입력(pickers.js 달력)은 메뉴 안 "다른 날" → 같은 달력으로, 시간 직접 입력(pickers.js 2번)은 30분 칸 목록(07:00~21:30)과 찾기로 대신했다. 추가하면 창을 닫는다(시안). 토스트("…에 추가했어요")는 앱에 토스트가 없어 뺐다.
- [결정] 상세 설명은 시안의 contenteditable 문단 대신 textarea(서버 description은 평문).
- [결정] `addTodo`가 지금 시각 기준 시간을 자동으로 넣으므로, 새 할 일 창은 만든 뒤 고른 시간대(없으면 종일)를 `setTodoTime`으로 다시 적는다. 실제 모드에서 새 id가 목록에 들어온 뒤 하도록 Provider가 기다린다(`afterCreate`). 실제 모드는 생성 POST 뒤 PATCH가 한 번 더 간다.
- [버그] Chrome은 사용자 활성화 없이 연달아 누른 Esc(두 번째 close request)에서 `cancel`을 막아도 `<dialog>`를 닫는다. 메뉴, 범위 질문의 Esc는 `keydown`에서 먼저 처리한다. 다른 Task의 중첩 Esc도 같은 문제가 있을 수 있다.
- [버그] Enter로 제목 입력을 끝내면 그 Enter가 바로 뜬 범위 질문의 첫 단추를 누르던 것을 막았다(`preventDefault`, 질문 포커스는 다음 프레임).
- [기존] `TaskDetailPanel`은 `CalendarDashboard`, `TodoBoard`(`TodoDetailPane`)가 아직 써서 지우지 않았다. 두 화면이 `useTodoEditor().openTodo`로 바뀌면(Task 3, 8) `TaskDetailPanel`, `TodoDetailPane`, `RecurrencePopover`, `DatePickerPopover`, `RecurrenceScopeDialog`, `RecurrenceCustomDialog`, `TagEditor`를 지운다(TagEditor의 lint 오류도 같이 없어짐).
- [기존] `shell.todoEditor.*` i18n 키(Task 1 임시 창)는 이제 안 쓴다. Task 11 정리 대상.
- [시안] 시안 26의 상태 줄 아이콘은 회색 원(진행 전)인데 앱은 기존 `StatusIcon`(lucide) 색을 따른다. 크기와 자리는 같다.
## Task 5 (회고 주제)

- [결정] 주제 색: `createdAt` 순서로 `--tpc1..4`를 돌려 쓰고(`assignTopicColors`), 실제 모드는 정한 색을 localStorage(`archive.topicColors`)에 기억해서 앞서 만든 주제를 지워도 남은 주제 색이 그대로다. 새 기기에서는 다시 `createdAt` 순서. 완전히 고정하려면 서버에 색을 두어야 하는데 06 §5 결정으로 만들지 않는다.
- [결정] 주제 데모(`entities/topic/model/demo.ts`, `buildDemoTopics(today)`)는 시안 TOPICS/TV 데이터를 그대로 쓰고 날짜만 `today - 2026-11-03` 만큼 옮긴다(기준일이 11-03이 되면 시안 날짜 그대로). 근거 회고 id는 시안 id(`d1102`, `w1025` ...)라 Task 4 데모 회고 id가 같으면 "회고 열기"가 그 회고로 간다. 제목 없는 회고는 화면이 기본 제목(`6월 2일 회고`, `6월 1주차 회고`)을 만든다.
- [결정] 힘 배치 엔진(`shared/lib/force-graph/engine.ts`)은 확정 분기(GN=5 동심원, 원 점, 종류 색)만 옮겼다. 계획 API의 `mode: "shape" | "glyph"`, 시안의 hulls, 깊이, 시간 재생, 점 찾기는 없다. 종류 숨기기 `hide(kinds)`를 더했다. 계산(`createSimulation`, `fitView`, `zoomView`)과 SVG(`createForceGraph`)를 나눠 계산만 테스트한다.
- [시안] 명세는 큰 주제 거르기에서 "하나를 고르면 나머지 흐리게"인데 시안 동작은 고르지 않은 항목, 빈 날, 빈 주를 숨긴다. 시안 동작을 따랐다(고르지 않은 거르기 글자는 흐리게).
- [시안] 연결 위 바의 안내 글("휠로 확대 ...")은 시안에 스타일이 없어 14px 본문색으로 보인다. 시안 그대로 맞췄다.
- [서버] 실제 모드 목록 카드에는 한 줄 요약, 기간, 정리 상태, 새 회고 수, 최근에 한 일이 없다(06 §3). 지금은 설명, 수, `digest_watermark_date_key` 유무("정리 전")만 보인다. 연결의 커밋은 07 §2 기간 커밋 조회가 있어야 해서 데모에서만 보인다.
- [결정] 실제 모드에서 넘기기 카드의 "정리하기"는 그 주제를 열고(정리 감시는 열린 주제 하나만 한다) 본문의 정리하기로 한다. 데모는 그 자리에서 1.8초 뒤 정리됨.
- [결정] 설명 고치기는 시안의 contenteditable 대신 `textarea`(`field-sizing: content`, Enter 저장, Esc 되돌림).
- [결정] 760px 아래: 카드 한 줄 한 장, 하루 카드의 큰 주제 열은 한 일 아래 줄, 연결 옆 칸은 그래프 아래.
- [기존] `widgets/retrospective-studio`의 옛 주제 파일(`TopicsPane`, `TopicDocument`, `TopicPicker`, `TopicPillBar`, `TopicSourceListModal`, `useTopics`, `useTopicDigest`, `useTopicStats`, `useLastViewedTopic`, `app/styles/widgets/topic-studio.css`)은 `RetrospectiveStudio.tsx`(Task 4)가 아직 `TopicsPane`을 import 해서 남겼다. Task 4가 주제 영역을 `TopicStudio`로 바꾸면 지울 수 있고 lint 오류 4개가 함께 없어진다. 실제 모드 동작(정리 생성 202, SSE+폴링, 열 때 진행 중 이어받기)은 `widgets/topic-studio/model/useLiveTopics.ts`로 옮겼다.

## 리뷰 (오케스트레이터, Task 5)

- [남은 일] 연결 그래프의 고리 이름이 셋(큰 주제, 회고, 할 일)만 보이고 시안의 바깥 "커밋" 고리 이름이 없다. Task 11에서 확인하고 고친다.
- [남은 일] 주제 화면의 회고 사이드바와 도구 막대는 Task 4가 붙인다.
