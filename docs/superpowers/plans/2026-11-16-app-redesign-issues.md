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

## Task 3 (캘린더)

- [결정] 데모 기준일 `DEMO_ANCHOR_DATE_KEY` = 2026-11-03(시안과 같음), 데모 "지금" = 오후 2시 20분(`DEMO_NOW_MINUTES`, `useNowMinutes()`). 할 일 시드는 `app/config/seed/todoSeed.ts`(시안 t1~t14, m1~m12, id 앞에 `demo-`). 데모 `getInitialAppState` 가 빈 목록 대신 이 시드를 쓴다(`initialState.ts`, 한 줄).
- [결정] 시안의 마감(`due`)과 기간 끝(`until`)은 서비스에서 `dueDate` 하나라, 기간 할 일(리팩터링 스프린트, 온보딩 문서 개편, 사이드 프로젝트 배포)만 옮겼다. "i18n 문구 점검"의 마감 11/4 는 옮기지 않았다(옮기면 4시 블록이 기간 막대가 된다). "BE 요청 문서 초안"은 10/31 시작 11/2 마감으로 넣어 지난 마감 막대(빗금)가 11/1 주에 보인다(시안 캘린더에는 없음). 반복은 "일일 회고 작성"(매일)만, 데모에는 반복 펼치기 로직이 없어 11/3 에만 보인다(시안 화면과 같음).
- [결정] 데모 GitHub 은 연결됨(`DEMO_GITHUB_STATE`, 이메일 권한 없음 → 연동 문제 "GitHub 권한 필요"). 전에는 데모에서 미연결 고정이었다(`AppProvider` 의 데모 분기와 `loadCommits` 데모 분기를 바꿈). `loadCommits` 는 데모에서도 실제 API 를 부르던 버그가 있었다(`!USE_API` 만 검사) → 데모 커밋을 돌려준다.
- [결정] 연동 문제는 실제 데이터로 만든다: Google = `calendarPushStatus === "failed"` 인 할 일("다시 보내기" = `toggleTodoCalendarLink` → POST calendar-link, 데모는 화면에서만 지움), GitHub = 연결됨 && `hasVerifiedEmails === false`("권한 받기" = 설정 시트 link). 그래서 실제 모드에서도 보인다(서버 기능 플래그 아님).
- [결정] 사용자 캘린더(목록, 보이기/숨기기, 이것만 보기, 관리 창, 카드 책갈피)는 `userCalendars` 기능일 때만. 할 일↔캘린더 배정은 서버 필드가 없어 데모 표(`DEMO_TODO_CALENDAR`)와 화면 안 저장소. 데모에서 새로 만든 할 일은 기본 캘린더. 색은 팔레트 토큰 `--cal-c1..c8`(새로 더함).
- [결정] 태그 순서: 데모(`tagAdmin`)는 시안 순서(`DEMO_TAG_ORDER`), 실제 모드는 가나다순. 태그 거르기는 늘 보인다.
- [결정] 주간은 시안대로 옆으로 끝없이 이어지는 날짜 열(처음 70일, 끝에서 7열 안쪽에 닿으면 28일씩), 월간은 위아래로(처음 26주, 8주씩). 일간은 같은 열 구조에서 한 열이 화면 하나(옆으로 넘김, scroll-snap). 서버 목록은 보이는 범위 기준으로 62일 이하 한 번에 다시 불러온다(`hydrate/todos` 가 목록을 통째로 바꾸므로). 보이는 범위가 크게 바뀌면 그 전 범위 할 일은 다시 불러올 때까지 빠진다.
- [결정] 끌어 놓기는 캘린더 전용 포인터 끌기(`useCalendarDrag`)로 바꿨다(시간 칸 사이 날짜·시각 이동, 끝 시각 늘리기, 종일 줄로 놓으면 시간 빼기, 날짜 머리·월간 칸에 놓으면 날짜만, 기간 할 일은 시작·마감 함께). 옛 `DayCell`/`DraggableMonthChip`/`timelineDrag`/`CalendarLegend`/`useCalendarNav` 와 확대(Ctrl+Shift+F) 기능은 지웠다. `TODO_DRAG_KIND` 는 할 일 보드가 써서 남김.
- [결정] 할 일 카드를 누르면 `useTodoEditor().openTodo`, 빈 칸을 누르면 그 30분 칸부터 1시간, 끌면 그 범위로 `createTodo`. 월간 빈 칸은 날짜만. 옛 인라인 추가 입력은 없앴다.
- [결정] 시각 표시는 시안대로 12시간제(9:00 ~ 10:30 AM)를 모든 언어에 쓴다. 날짜·요일·달 이름은 `Intl`(로케일).
- [결정] 보기 메뉴는 셸 도구 막대가 `overflow:hidden` 이라 `body` 에 포털로 띄운다(fixed).
- [결정] 오늘 회고 "쓰기"는 하루 닫기(Task 8)가 오기 전까지 회고 화면으로 간다(`onWriteRetro` 로 바꿀 수 있음). "보기"는 그날 일일 회고 편집기.
- [결정] 시안 확인 화면 `?rdw=1`, `?issues=0`, `?gh=0` 은 앱에 쿼리 분기를 만들지 않고 데모 데이터를 잠깐 바꿔 찍었다(오늘 일일 회고 하나, 실패 푸시 없음과 이메일 권한 있음, GitHub 미연결).
- [기존] 375px 에서 셸 도구 막대가 좁아 달 제목이 0 폭으로 줄고 보기 버튼이 탭에 가린다(넘침은 없음). Task 1 의 375px 처리와 같이 Task 11 에서 볼 것.
- [서버] 사용자 캘린더(목록, 색, 기본, 할 일 배정)와 태그 순서·색은 서버에 없다(be-request 6단계). 실제 모드에서는 숨긴다.
- [시안] 시안 미니 달력·주간 머리의 회고 표시는 회고 데모(Task 4)가 들어와야 보인다. 지금 데모 회고는 비어 있다.

## Task 4 (회고 목록, 레일, 편집기, 새 회고 창)

- [결정] 구조: `RetroStudioProvider`(상태와 동작, `widgets/retrospective-studio/model/RetroStudioContext.tsx`)를 페이지가 감싸고, 셸 슬롯에 `RetroSidebar`(sidebar), `RetroTopbar`(toolbar: 오늘 + 회고/주제)를 넣는다. 본문은 `RetrospectiveStudio`(회고 영역 + 창들), 주제 영역 분기(`area === "topic"` → `TopicStudio`)는 위젯끼리 import 하지 않게 페이지(`RetrospectivesPage`)에 두었다(계획은 RetrospectiveStudio 안). 주제 영역에서도 같은 사이드바와 도구 막대가 보인다.
- [결정] 계획의 "도구 막대(연도, 월, 주 ...)"는 시안대로 본문 위 줄(`RetroToolbar`)이고, 셸 상단 toolbar 슬롯은 `RetroTopbar`. 시안 상단의 "한 화면씩"은 시안 번호(RL) 글자라 옮기지 않았다.
- [결정] `RetroRail`(`@/widgets/retrospective-studio`)은 Task 5의 TopicRail 구현을 옮겨 props(items, currentId, onGo, trackLabel, prevLabel, nextLabel, posText)에 `marks`(점 줄 아래 달 이름)와 currentId 따라가기(기간을 고르면 그 회고로)를 더했다. `topic-studio/ui/TopicRail.tsx`는 이것을 다시 내보내는 한 줄로 바꿨다. 넘기기 CSS는 `.rv-l1 .crl`(retro.css)과 `.tpv .crl`(topic-v.css)에 두 벌 있다(Task 11에서 하나로).
- [결정] 회고 데모: `app/config/seed/retroSeed.ts`(시안 12편, 폴더 2개, id 는 시안 id `d1102`, `w1025` ... 로 Task 5 근거와 같음). seedState(mock)와 데모 시작 상태가 같이 쓴다. 요약 dateKey 는 서버 계약대로 기간 끝, 주는 ISO(월~일)라 시안의 10/25~10/31 주간은 10/26~11/1, 10/18~10/24 는 10/19~10/25 로 옮겼다. 시안 본문의 `[[회고 링크]]`, `#태그`는 앱에 없는 기능이라 평문.
- [시안] 시안 주간은 일~토(10/25~10/31)인데 서버 요약 주는 ISO 월~일이다. 앱은 서버를 따른다. 요약 만들기 창의 주 이름("10월 4주")과 요약 제목("10월 4주차 회고")은 시작일이 그 달 몇째 칠일인지(시안 제목과 맞춤). 시안은 창의 "10월 5주"와 제목 "10월 4주차"가 서로 달랐다.
- [결정] 요약 제목은 이 화면에서 시안 모양("10월 4주차 회고", "10월 회고", "2025년 회고")으로 만든다(`model/format.ts` `retroTitle`). 다른 화면(명령 팔레트 등)은 아직 기존 `entryDisplayTitle`("2026-W44 주간 회고")이라 다르게 보인다(Task 11).
- [결정] 제목 없는 일간 회고는 "11월 1일 회고"로 보이고, 기존 서버 기본 제목("2026-11-03 일일 회고" 꼴)도 같은 이름으로 보인다. 새 회고 창에서 제목을 비우면 "11월 3일 회고"로 저장한다.
- [서버] 일간 회고는 하루 한 편(createDailyEntry, JOURNAL_ENTRY_ALREADY_EXISTS)이라 시안의 "이미 1편이 있어요. 따로 한 편으로 저장돼요"는 할 수 없다. 이미 있는 날을 고르면 "만들면 그 회고를 열어요"로 안내하고 연다.
- [서버] `/entries/paginated`에 폴더 거르기가 없고 `/folders/contents`는 검색, 기간을 받지 않는다. 실제 모드에서 폴더를 고르면 폴더 내용을 페이지씩 받아 그 안에서 검색, 기간을 거른다(받은 범위 안에서만).
- [결정] 폴더: 사이드바 "폴더"를 펴면 전체 + 폴더 트리(하위 폴더 들여쓰기). 폴더를 누르면 거르기(위 칩으로 풀기), 줄 옆 ⋯ 메뉴로 이름 바꾸기, 안에 폴더 만들기, 삭제. 카드를 폴더 줄에 끌어 놓으면 옮기고, 폴더 줄을 다른 폴더 줄에 놓으면 그 안으로 넣는다(기존 기능 유지). 시안의 폴더 카드 격자는 없다.
- [결정] "N개 더 보기": 데모/mock 은 9장씩, 실제 모드는 서버 20개씩 이어 받아 9장씩 보인다.
- [결정] 편집기는 시안 기본 분기(ed 없음, 문서 한 장)를 옮겼다. 본문은 기존 TipTap(rich-editor, 슬래시 메뉴, 블록 손잡이) 그대로이고 손잡이 자리 58px는 760px 이상에서 왼쪽 여백으로 뺐다. 시안 본문의 `[[` 회고 링크 고르기는 마크다운 저장과 맞지 않아 옮기지 않았다(placeholder 문구도 "/ 를 치면 블록").
- [결정] 기존 동작 유지: GitHub 연결 시 그날 커밋 목록과 "GitHub에 저장"(⋯ 메뉴), 저장 상태 점(GitHub 저장됨/저장 대기), AI 요약 되돌리기 확인, 요약 생성 중/실패 띠. 기존 확장 모드(목차 오버레이)는 시안의 집중 쓰기(Ctrl+Shift+F, Esc)로 바꿨다.
- [결정] "지난번에 해 보자고 한 것"은 바로 앞 일간 회고들에서 '내일/다음/tomorrow/next' 머리글 아래 목록을 찾는다(`prevActions`). 체크는 화면 안 상태(시안도 저장 안 함). "→ 할 일로"(목록 줄 옆)는 내일 할 일로 만든다. 시안의 "할 일에 넣음" 표시는 마크다운에 남길 수 없어 빼고 알림만 띄운다.
- [결정] 요약 만들기 창: 데모에서는 고르는 데까지 되고 "요약 만들기"를 누르면 기존처럼 로그인 안내(demo.locked). 덮어쓰기, 데이터 부족 확인은 시안처럼 같은 창 안에서 바뀐다(기존 ConfirmModal 두 개와 PeriodPickerModal 대신).
- [결정] 빈 화면: 회고가 하나도 없으면 셸 안 가운데에 시안 rest.js 문구("아직 회고가 없어요" + 첫 회고 쓰기). 거른 결과가 없을 때는 시안 `.q-empty` 상자. 데모에는 회고 시드가 있어서 빈 화면 확인은 시드 모듈을 비워 찍었다.
- [결정] 새 회고 창 폴더 기본값: 거르는 폴더, 없으면 가장 최근 일간 회고의 폴더(시안 기본 "ARCHIVE 개발"과 같은 결과).
- [결정] 단축키: N 새 회고, / 찾기, ←→ 넘기기(트랙에 포커스), Esc 메뉴, 창, 집중 끝내기. 팔레트 명령 "오늘 회고 쓰기"(order 50)는 회고 탭이 마운트된 동안만(셸 계약).
- [기존] 옛 회고 위젯 파일(RetroGallery, RetroCard, RetroFolderCard, RetroDocHead/Rail, RetroExpandOverlay, PeriodPickerModal, EntryFolderPicker, RetroTabBar, useRetroFilter, useFolderContents, useFolderNav, useRetroEntriesPage 등)과 옛 주제 파일(Topic*, useTopic*, topic-studio.css)을 지웠다. retro.css 는 새 화면 것만 남겼다. 남은 쓰지 않는 i18n 키(`retro.gallery.*`, `retro.period.*`, `retro.expand.*`, `retro.filter.*` 등)는 Task 11 정리 대상.
- [기존] 데모로 처음 들어오면 "AI 요약 처리 중" 창이 뜨는 문제는 그대로(최소화하고 찍었다).
