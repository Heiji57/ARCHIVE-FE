# 앱 리디자인 퍼블리싱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `prototypes/linear-shell/`에서 확정한 화면 전부를 `my-app`(React 19, FSD)으로 옮겨, 데모 모드(`?demo=true`)에서 시안과 같은 결과물이 나오게 한다.

**Architecture:** 셸(사이드바, 상단 탭, 오른쪽 줄, 오른쪽 패널, 설정 시트)을 먼저 바꾸고, 페이지가 셸의 슬롯에 자기 사이드바와 도구 막대를 넣는다.
서버에 아직 없는 기능은 `useServerFeature()`로 가려서 실제 모드에서는 숨기고 데모 모드에서는 데모 데이터로 보인다(`api.yaml`에 없는 엔드포인트는 만들지 않는다).
작업은 git worktree 단위로 나눠 병렬로 진행하고, 통합 브랜치 `feat/app-redesign`에 하나씩 합친다.

**Tech Stack:** React 19, TypeScript 6, Vite 8, 표준 `fetch`, CSS 파일, lucide-react(이미 있음). 테스트는 Vitest(dev 전용, 이번에 추가).

**Spec:** `docs/superpowers/specs/2026-11-10-app-redesign-publishing-design.md` (기준 화면 목록 `prototypes/linear-shell/final.html`)

## Global Constraints

- 시안 기준 화면: `prototypes/linear-shell/final.html`의 목록 전부. 시안 번호 파라미터 없이 열린 모양이 확정안이다.
- `my-app/CLAUDE.md` 0장 그대로: `api.yaml`에 없는 엔드포인트, 필드를 만들지 않는다. 런타임 라이브러리를 추가하지 않는다. pnpm만 쓴다. FSD `app → pages → widgets → entities → shared`.
- 서버에 없는 기능: `useServerFeature(name)`이 `false`면 그 UI를 렌더하지 않는다. 데모 모드에서는 `true`.
- 데모 모드에서는 실제 API를 부르지 않는다(`isDemoMode()`, `apiActive` 규칙 유지).
- 시안 코드(전역 스크립트, 문자열 HTML)를 그대로 옮기지 않는다. 확정 분기의 구조와 CSS 값만 컴포넌트로 다시 쓴다.
- 색과 폰트는 토큰으로만 쓴다(`app/styles/tokens/`). 다크 모드만.
- 문구는 전부 i18n 키. 한국어는 시안 문구를 그대로, 영어는 번역, 나머지 14개 언어는 영어 값으로 채운다(Task 0의 모듈 방식이 자동으로 채움).
- 글자 크기는 `my-app/CLAUDE.md` 10장 3단계(12/16/18px)를 따르되, 시안이 정한 화면 크기(13px, 14px 등)는 시안을 우선한다. 충돌은 이슈 기록에 남긴다.
- `AppProvider.tsx`(2,095줄)에 새 상태를 넣지 않는다. 새 상태는 위젯 단위 훅과 Context로.
- 랜딩(`pages/landing`, `ArchiveLogo`)은 건드리지 않는다. 파비콘은 그대로 둔다(랜딩과 공유).
- 처음 화면은 캘린더(`/`). `/dashboard`는 `/`로 보낸다.
- 키보드: Esc로 닫기, 포커스 복귀, 화살표 이동 등 시안에 있는 동작을 함께 옮긴다. 모든 버튼에 `:focus-visible`.
- `prefers-reduced-motion: reduce`이면 움직임을 멈춘다(그래프, 빗금이 포함).
- 375px 폭에서 가로 넘침이 없어야 한다(모바일 전용 화면은 만들지 않는다).
- 완료 기준(모든 Task): `pnpm build` 통과, `pnpm test` 통과, `pnpm lint`의 오류가 기준선(아래)보다 늘지 않음, 데모 모드 스크린샷이 시안과 같은 구조.

### 기준선

- `pnpm build`: 통과(약 9초).
- `pnpm lint`: 오류 11개, 경고 5개. 오류가 있는 파일: `entities/todo/ui/TagEditor.tsx`, `pages/landing/ui/LandingNav.tsx`, `widgets/calendar-dashboard/ui/{MonthGrid,WeekGrid}.tsx`, `widgets/global-search/ui/GlobalSearch.tsx`, `widgets/retrospective-studio/model/{useTopicStats,useTopics}.ts`, `widgets/retrospective-studio/ui/{TopicSourceListModal,TopicsPane}.tsx`. 이 파일을 다시 쓰면 그 오류도 없앤다.

## 작업 방식 (worktree와 통합)

- 통합 브랜치: `feat/app-redesign` (현재 `main-design-prototypes-ae1c96fb` HEAD에서 만든다. 시안과 문서가 들어 있어 작업자가 시안을 읽을 수 있다).
- Task마다 브랜치 `redesign/<task-slug>`와 worktree `/home/minsu/.paradev/worktrees/ARCHIVE-FE/redesign-<task-slug>`를 `feat/app-redesign`에서 만든다. worktree마다 `cd my-app && pnpm install --frozen-lockfile`.
- dev 서버 포트는 Task마다 고정(아래 표). `pnpm dev --port <port> --strictPort`.
- 끝난 Task는 리뷰(아래 "리뷰 게이트") 후 `feat/app-redesign`에 `--no-ff`로 합치고, 진행 중인 다른 worktree는 필요할 때 `feat/app-redesign`을 merge해서 따라간다.
- 스크린샷 도구: `node /tmp/claude-1000/-home-minsu--paradev-worktrees-ARCHIVE-FE-prototype-5-github-hallmark-ae1c96fb/3f46a657-953e-4cdd-be44-46e5ff68b86b/scratchpad/shot.mjs <outdir> name=<url>[|<click-selector>]...` (환경 변수 `W`, `H`로 크기). 시안은 `file:///home/minsu/.paradev/worktrees/ARCHIVE-FE/prototype-5-github-hallmark-ae1c96fb/prototypes/linear-shell/<page>`.
- 시안 데이터 기준일은 2026-11-03, 앱 데모 기준일은 `DEMO_ANCHOR_DATE_KEY`(2026-06-15). 데이터 내용은 달라도 되고, 구조와 모양이 같아야 한다.

| 묶음 | Task | 선행 | 포트 |
|---|---|---|---|
| 0 | Task 0 기반, Task 1 셸 | 없음 | 5201 |
| A (병렬) | Task 2 할 일 모달, Task 3 캘린더, Task 4 회고, Task 5 회고 주제, Task 6 설정, Task 7 로그인과 가입 | Task 1 | 5202~5207 |
| B (병렬) | Task 8 할 일 화면과 오른쪽 패널과 하루 닫기, Task 9 AI 탭과 빗금이 | Task 2, 3 | 5208, 5209 |
| C | Task 10 AI 추천(패널 탭, 캘린더 흐린 칸) | Task 8, 9 | 5210 |
| D | Task 11 통합 점검 | 전부 | 5211 |

### 리뷰 게이트 (Task마다)

1. `pnpm build`, `pnpm test`, `pnpm lint`(기준선 비교).
2. Task의 "확인 화면"을 시안과 앱(데모 모드)에서 같은 크기로 찍어 나란히 본다. 375px 폭에서 `document.documentElement.scrollWidth <= 375`.
3. 데모 모드에서 `localhost:8000` 요청이 0건.
4. diff: FSD 방향, `AppProvider` 증가 없음, 리터럴 색 없음, i18n 키 누락 없음, 고르지 않은 시안 분기를 옮기지 않았는지.
5. 실패하면 같은 작업자에게 고칠 것을 보내고 다시 본다.

### 작업자 보고 형식

끝나면 (1) 만든 것, (2) 확인 화면 스크린샷 경로, (3) 시안과 다르게 한 곳과 이유, (4) 발견한 문제(서버 필요, 기존 버그, 시안 모순)를 보고한다. (4)는 `docs/superpowers/plans/2026-11-16-app-redesign-issues.md`에 모은다.

## Review Focus

- 실제 모드(데모 아님)에서 서버에 없는 기능의 버튼이 보이거나 눌려서 404를 부르는 것 → `useServerFeature`로 숨김. Task 0의 테스트와 각 Task의 실제 모드 스크린샷 1장으로 확인.
- 16개 언어 중 영어 이외 언어에서 키가 비어 빌드가 멈추거나 빈 문자열이 보이는 것 → Task 0의 모듈 병합 테스트(`ja`로 새 키를 읽으면 영어 값).
- 주 시작 요일이 일요일인 사용자의 주간 캘린더, 미니 달력, 하루 닫기 날짜 → Task 3의 `weekDays()` 테스트에 `weekStart: "sun"` 경우.
- 반복 할 일 하나를 고칠 때 "이 일만 / 이후 모두 / 전부" 범위가 없어지는 것 → Task 2 테스트 `applyScope`.
- 사이드바를 접었을 때와 375px에서 상단 탭과 검색이 겹치는 것 → Task 1 확인 화면에 접힌 상태와 375px 포함.

---

### Task 0: 기반(i18n 모듈, 토큰, 서버 기능 플래그, 아이콘, Vitest, 데모 데이터 자리)

**Files:**
- Create: `my-app/src/shared/lib/i18n/modules/index.ts`, `my-app/src/shared/lib/i18n/modules/types.ts`
- Modify: `my-app/src/shared/lib/i18n/keys.ts`, `my-app/src/shared/lib/i18n/dictionaries.ts`
- Create: `my-app/src/app/styles/tokens/redesign.css`; Modify: `my-app/src/app/styles/index.css`
- Create: `my-app/src/shared/lib/serverFeatures.ts`, `my-app/src/shared/lib/serverFeatures.test.ts`
- Create: `my-app/src/shared/ui/icons/index.tsx`
- Create: `my-app/src/app/config/demo-redesign/index.ts`
- Modify: `my-app/package.json` (`vitest` devDependency, `"test": "vitest run"`), Create: `my-app/vitest.config.ts`

**Interfaces:**
- Produces:
  - i18n 모듈: 각 기능은 `src/shared/lib/i18n/modules/<name>.ts`에 `export const <name>I18n = defineI18nModule({ ko: {...}, en: {...} })`. `ko`와 `en`의 키 집합이 같아야 컴파일된다. `modules/index.ts`의 `I18N_MODULES` 배열에 한 줄 추가로 등록. `TranslationKey`는 기존 키 ∪ 모든 모듈 키. ko/en 이외 로케일은 모듈 값으로 `en`을 쓴다.
  - `type ServerFeature = "ai" | "userCalendars" | "tagAdmin" | "trash" | "exports" | "accountDelete" | "avatar" | "settingsExt" | "notificationPrefs" | "topicStructured" | "overdueQuery" | "todoBatch" | "commitRange" | "searchScope"`
  - `function isServerFeatureOn(f: ServerFeature, opts: { demo: boolean }): boolean` (데모면 `true`, 아니면 `SERVER_FEATURES[f]`, 지금은 전부 `false`) / `function useServerFeature(f: ServerFeature): boolean` (`isDemoMode()` 사용)
  - 토큰(시안 `shared/shared.css` `:root` 값 그대로): `--primary --primary-h --primary-a --ink2 --ink3 --ink4 --s1 --s2 --s3 --s4 --line --line2 --done --warn --danger --r --r2 --hh --mono`(이미 있는 `--ink`, `--canvas`는 값이 같으므로 다시 정의하지 않는다). 회고 종류 색과 주제 색(`--rc-*`, `--th1..4`, `--tpc1..4`)과 AI 인디고는 `prototypes/linear-shell/shared/retro-cards.css`, `topicv.css`, `ai.css`의 `:root`에서 가져온다. 이름이 기존 토큰과 겹치면 기존 값과 같은지 확인하고, 다르면 `--rd-` 접두를 붙이고 이슈에 남긴다.
  - `shared/ui/icons`: 시안 `shared/shared.js`의 `A.ico`와 각 시안 파일의 `I(...)` 경로를 `({ size = 16, ...props }: IconProps) => JSX.Element` 컴포넌트로. lucide에 같은 모양이 있으면 lucide를 쓰고 여기에 만들지 않는다.
  - `app/config/demo-redesign/index.ts`: 데모 전용 데이터 모음의 자리(이후 Task가 `demoCalendars`, `demoCommits`, `demoTopicStructured`, `demoAi*` 등을 여기에 추가). 이 Task에서는 빈 export와 형식 주석만.

- [ ] **Step 1: Vitest 설치와 설정** — `pnpm add -D vitest`, `vitest.config.ts`는 `vite.config.ts`의 `@` alias를 같이 쓴다. `pnpm test`가 "No test files"가 아니라 아래 테스트를 돌리게 한다.
- [ ] **Step 2: 실패하는 테스트**

```ts
// serverFeatures.test.ts
expect(isServerFeatureOn("ai", { demo: true })).toBe(true);
expect(isServerFeatureOn("ai", { demo: false })).toBe(false);
// i18n: modules 테스트 (src/shared/lib/i18n/modules/index.test.ts)
expect(translate("ja", "test.sample")).toBe(EN_VALUE); // 테스트 전용 모듈 값
expect(translate("ko", "test.sample")).toBe(KO_VALUE);
```
- [ ] **Step 3: `pnpm test` 실패 확인**
- [ ] **Step 4: 구현** — `defineI18nModule`, `I18N_MODULES`, `DICTIONARIES` 병합, `serverFeatures.ts`, 토큰 파일과 `index.css` import(토큰 블록 끝), 아이콘, 데모 자리.
- [ ] **Step 5: `pnpm test`, `pnpm build` 통과 확인**
- [ ] **Step 6: Commit** `chore(redesign): i18n 모듈, 토큰, 서버 기능 플래그, 아이콘, vitest`

### Task 1: 앱 셸

시안: `shared/planner.js`(셸 동작), `shared/sidevar.js`(사이드바 공통 부분), `shared/usermenu.js`, `shared/logo.js` + `logo-crest.html`(39번), `shared/rest.js`(알림 패널, Ctrl+K 검색과 명령, 빈 화면), `shared/shared.css`. 화면은 `d-calendar.html`, `d-retro2.html`, `d-settings.html`의 바깥 틀.

**Files:**
- Rewrite: `my-app/src/widgets/app-shell/ui/AppShell.tsx`; Create: `my-app/src/widgets/app-shell/ui/{Sidebar,TopBar,RightRail,UserMenu,ShellPage,RightPanelHost,SettingsSheetHost}.tsx`, `my-app/src/widgets/app-shell/model/{shellSlots.ts,rightPanel.ts,settingsSheet.ts}`, `my-app/src/app/styles/layout/redesign-shell.css`
- Create: `my-app/src/shared/ui/app-logo/AppLogo.tsx` (39번. 랜딩 `ArchiveLogo`는 그대로)
- Rewrite: `my-app/src/widgets/global-search/ui/GlobalSearch.tsx`(명령 팔레트: 범위 탭 전체/할 일/회고/명령, Ctrl+K), `my-app/src/widgets/notifications/ui/NotificationPanel.tsx`(시안 rest.js 모양)
- Modify: `my-app/src/app/App.tsx`, `my-app/src/app/router/navigation.ts`, `my-app/src/app/model/types.ts`(`AppRoute`에 `"ai"` 추가, `"dashboard"`·`"settings"`는 경로 호환만)
- Create: `my-app/src/pages/ai/ui/AiPage.tsx`(자리만. 내용은 Task 9)
- Delete: `my-app/src/widgets/dashboard-overview/`, `my-app/src/pages/dashboard/`, 계정 유형 화면(`AccountTypeScreen`, `AccountTypeForm`), 설정의 계정 유형 카드
- Modify: `my-app/src/shared/lib/permissions.ts` → `canUseGithub(github: GitHubState): boolean`(연결 상태 기준), 기존 `can()` 호출처 전부 교체
- Create: `my-app/src/widgets/todo-editor/{index.ts,model/TodoEditorContext.tsx}` (Task 2가 채울 자리. 지금은 기존 `TaskDetailPanel`을 가운데 모달에 띄움)
- Create: `my-app/src/shared/lib/i18n/modules/shell.ts`
- Test: `my-app/src/app/router/navigation.test.ts`

**Interfaces:**
- Produces:
  - `<ShellPage sidebar?: ReactNode toolbar?: ReactNode rail?: boolean>{children}</ShellPage>`: 페이지가 자기 사이드바 내용(로고와 접기, 사용자 메뉴 사이), 상단 왼쪽 도구 막대, 오른쪽 줄 표시 여부를 넣는다. 상단 오른쪽의 탭(AI, 캘린더, 할 일, 회고)과 검색 버튼은 셸이 그린다.
  - `useRightPanel(): { open: boolean; tab: RightPanelTab; setTab(t: RightPanelTab): void; toggle(t?: RightPanelTab): void; close(): void }`, `type RightPanelTab = "day" | "timeline" | "unscheduled" | "due" | "commits" | "ai"`, `registerRightPanelTab(tab: RightPanelTab, def: { labelKey: TranslationKey; count?: () => number | null; render: () => ReactNode; visible?: (ctx: { route: AppRoute; githubOn: boolean }) => boolean })` (탭 내용은 Task 8, 10이 등록).
  - 오른쪽 줄: 패널 열기 버튼들(시안 순서), 알림 벨. 회고와 AI 탭에서는 줄과 벨을 숨긴다.
  - `useSettingsSheet(): { open(section?: SettingsSection): void; close(): void; section: SettingsSection | null }`, `type SettingsSection = "account" | "general" | "work" | "retro" | "ai" | "link" | "notify" | "data"`. 사용자 메뉴의 "설정"과 `/settings`(경로 호환, `#<section>` 해시)로 연다. 시트 내용은 Task 6. 이 Task에서는 기존 `SettingsStudio`를 시트 안에 넣는다.
  - `useTodoEditor(): { openTodo(id: string): void; createTodo(defaults?: Partial<{ dateKey: string; startTime: string; endTime: string }>): void; close(): void }` (Task 2가 구현을 바꿔도 이 모양은 유지).
  - 회고 경로: `RetroRouteParams`에 `area?: "retro" | "topic"`, `topicId?: string`, `topicView?: "doc" | "graph"` 추가. `/retrospectives/topics`, `/retrospectives/topics/<id>`, `/retrospectives/topics/<id>/graph`.
  - 빗금이 자리: 셸 오른쪽 아래에 `<PetSlot/>`(Task 9가 채움).
- [ ] **Step 1: 실패하는 테스트** (`navigation.test.ts`)

```ts
expect(getRouteFromPath("/ai")).toBe("ai");
expect(getRouteFromPath("/dashboard")).toBe("calendar");
expect(getRetroParamsFromPath("/retrospectives/topics/tp1/graph")).toEqual({ area: "topic", topicId: "tp1", topicView: "graph" });
expect(getRetroPathFromParams({ area: "topic", topicId: "tp1" })).toBe("/retrospectives/topics/tp1");
expect(getRetroParamsFromPath("/retrospectives/editor/e1")).toEqual({ view: "editor", entryId: "e1" });
```
- [ ] **Step 2: 실패 확인** `pnpm test navigation`
- [ ] **Step 3: 경로 구현**, 테스트 통과
- [ ] **Step 4: 셸 구현** — 사이드바(260px 안팎, 접기, 접으면 아이콘만), 상단 막대(높이와 탭 밑줄은 시안), 오른쪽 줄, 오른쪽 패널 틀(탭 글자 줄 + 빈 내용), 사용자 메뉴(시안 usermenu.js 항목), 설정 시트 틀(왼쪽 섹션 목록과 찾기), 명령 팔레트, 알림 패널, AppLogo, 데모 배너 유지.
- [ ] **Step 5: 계정 유형 제거** — `canUseGithub`로 교체, 온보딩의 계정 유형 단계와 설정 카드 삭제, 빌드 통과.
- [ ] **Step 6: 확인 화면** (시안 ↔ 앱 `?demo=true`): 캘린더 바깥 틀(`d-calendar.html`), 회고 바깥 틀(`d-retro2.html`, 오른쪽 줄 없음), 설정 시트 열림(`d-settings.html`), 알림(`d-calendar.html?ntopen=1`), 검색(`d-calendar.html?cpopen=1`), 사이드바 접힘, 375px.
- [ ] **Step 7: Commit** `feat(shell): 사이드바, 상단 탭, 오른쪽 줄과 패널 틀, 설정 시트, 명령 팔레트`

### Task 2: 할 일 모달(26)과 새 할 일 창(3)

시안: `shared/tmodal4.js`(26번 가운데 모달, 값 옆 찾기 메뉴, 반복 범위 질문), `shared/newtodo.js` + `newtodo.html`(3번), `shared/pickers.js`(날짜, 시간, 태그 고르기), `shared/todomodal.css`, `shared/newtodo.css`, `shared/pickers.css`, `shared/tododetail.js`(마감일 항상 표시). 확인: `d-calendar.html?select=t4`, `?select=t5`, `?naopen=1`.

**Files:**
- Create: `my-app/src/widgets/todo-editor/ui/{TodoModal,NewTodoDialog,PropertyRow,ValuePicker,RepeatScopeDialog}.tsx`, `my-app/src/widgets/todo-editor/model/{applyScope.ts,applyScope.test.ts,useTodoDraft.ts}`, `my-app/src/app/styles/widgets/todo-editor.css`, `my-app/src/shared/lib/i18n/modules/todoEditor.ts`
- Modify: `my-app/src/widgets/todo-editor/model/TodoEditorContext.tsx`(Task 1 자리를 실제 구현으로)
- Delete(호출처가 없어지면): `my-app/src/entities/todo/ui/TaskDetailPanel.tsx`와 `TodoDetailPane` 계열. 재사용 가능한 `RecurrencePopover`, `DatePickerPopover`, `TagEditor`는 새 모양으로 다시 쓰거나 대체.

**Interfaces:**
- Consumes: `useTodoEditor()` 모양(Task 1), `useArchiveApp()`의 기존 할 일 액션(`addTodo`, `updateTodo` 등 — 이름은 `app/model/types.ts`의 `ArchiveAppContextValue`).
- Produces: `applyScope(series: RecurringSeries, instanceDateKey: string, patch: TodoPatch, scope: "this" | "following" | "all"): ScopedChange[]` (기존 반복 처리 함수가 있으면 그것을 감싼다).
- 사용자 캘린더 고르기 줄은 `useServerFeature("userCalendars")`일 때만.

- [ ] **Step 1: 실패하는 테스트** `applyScope.test.ts`: `"this"`는 그 날 한 건만 바뀜, `"following"`은 그 날부터 시리즈를 끊고 새 시리즈, `"all"`은 시리즈 규칙 자체 수정. 날짜 경계(시리즈 첫날에서 `"following"` = `"all"`과 같은 결과).
- [ ] **Step 2: 실패 확인** → **Step 3: 구현** → **Step 4: 통과 확인**
- [ ] **Step 5: 모달과 새 할 일 창 UI** — 시안의 속성 줄 순서, 값 옆 찾기 메뉴, 상태는 "더 보기" 안, 메모는 아래 본문, 마감일은 비어도 표시, Esc 닫기와 포커스 복귀.
- [ ] **Step 6: 확인 화면** 위 3개 + 실제 모드 1장
- [ ] **Step 7: Commit** `feat(todo-editor): 26번 할 일 모달과 3번 새 할 일 창`

### Task 3: 캘린더(주간, 일간, 월간)와 캘린더 사이드바

시안: `d-calendar.html`, `d-calendar2.html`(참고만), `shared/planner.js`(카드 6번, 하루 칸, 종일 줄, 지금 선), `shared/sidevar.js`(미니 달력, 오늘 회고 5번, 연동 문제 3번, 사용자 캘린더 목록, 태그), `shared/planner.css`, `shared/sidevar.css`. 확인: `d-calendar.html`, `?view=month`, `?rdw=1`, `?issues=0`, `?gh=0`.

**Files:**
- Rewrite: `my-app/src/widgets/calendar-dashboard/ui/{CalendarDashboard,WeekGrid,MonthGrid,DayTimeline}.tsx`(기존 끌어 놓기, 무한 스크롤 로직은 살림), Create: `my-app/src/widgets/calendar-dashboard/ui/{CalendarSidebar,CalendarToolbar,MiniMonth,TodayRetroLine,SyncIssues,CalendarList,TagFilter,EventCard}.tsx`, `my-app/src/widgets/calendar-dashboard/model/{weekDays.ts,weekDays.test.ts}`
- Modify: `my-app/src/pages/calendar/ui/CalendarPage.tsx`(ShellPage로 감쌈), `my-app/src/app/styles/widgets/calendar.css`
- Create: `my-app/src/shared/lib/i18n/modules/calendar.ts`, 데모 데이터 `demoCalendars`(개인, ARCHIVE 팀, 스터디)

**Interfaces:**
- Consumes: `ShellPage`, `useTodoEditor`, `useRightPanel`(오른쪽 줄 버튼은 셸 것), `useServerFeature("userCalendars")`, `useServerFeature("tagAdmin")`.
- Produces: `weekDays(anchor: Date, weekStart: "mon" | "sun"): Date[]`, `export function EventCard(props: { todo: Todo; variant: "week" | "month" | "allday"; ghost?: boolean })`(Task 10이 `ghost`로 흐린 칸을 그림), 캘린더 위에 흐린 칸을 얹는 자리 `CalendarOverlaySlot`(Task 10이 채움).
- 주 시작 요일: 지금 설정에 값이 없으면 `"sun"`(시안과 같음). 설정에 생기면 그것을 읽게 `weekStartPreference()` 한 곳에서.

- [ ] **Step 1: 실패하는 테스트** `weekDays.test.ts`: 2026-11-03(화) 기준 `"sun"` → 11/1~11/7, `"mon"` → 11/2~11/8, 월 경계 넘는 주.
- [ ] **Step 2~4: 구현과 통과**
- [ ] **Step 5: 화면** — 사이드바(미니 달력, 오늘 회고 줄, 캘린더 목록은 플래그, 태그 거르기, 연동 문제), 도구 막대(오늘, 2026년 11월, 주간/일간/월간 고르기), 주간 칸과 종일 줄과 지금 선, 월간은 위아래로 이어짐, 카드 6번 모양.
- [ ] **Step 6: 확인 화면** 위 5개 + 375px + 실제 모드
- [ ] **Step 7: Commit** `feat(calendar): 주간, 일간, 월간과 캘린더 사이드바`

### Task 4: 회고(목록, 편집기, 새 회고 창)

시안: `d-retro2.html`(회고 영역, `area` 없음), `shared/retro-cards.css`, `shared/retro-views.css`(카드, 레일 `.crl`), `shared/retro-editor.css`, `shared/retro-new.css`, `shared/rest.js`(빈 화면). 확인: `d-retro2.html`, `?empty=1`, 편집기 열기, 새 회고 창 열기, 보기 레일.

**Files:**
- Rewrite: `my-app/src/widgets/retrospective-studio/ui/{RetrospectiveStudio,RetroGallery,RetroEditor}.tsx`, Create: `.../ui/{RetroSidebar,RetroToolbar,RetroCard,RetroRail,NewRetroDialog,RetroEmpty}.tsx`
- Modify: `my-app/src/pages/retrospectives/ui/RetrospectivesPage.tsx`(ShellPage, `rail={false}`), `my-app/src/app/styles/widgets/retro.css`
- Create: `my-app/src/shared/lib/i18n/modules/retro.ts`
- 주제 영역(`area: "topic"`)은 Task 5의 `TopicStudio`를 렌더하는 분기만 둔다. 폴더 기능 유지.

**Interfaces:**
- Consumes: `ShellPage`, `RetroRouteParams`(Task 1), `TopicStudio` (Task 5가 `widgets/topic-studio`에서 export. Task 4는 import만 하고, Task 5보다 먼저 끝나면 기존 주제 화면을 임시로 연결).
- Produces: `RetroRail`(레일 `.crl`과 그 동작) — Task 5가 주제 넘기기에 쓴다. props: `items: Array<{ id: string; render: () => ReactNode }>`, `currentId`, `onGo(id)`.

- [ ] **Step 1: 실패하는 테스트** — 목록 묶기 함수 `groupByMonth(entries): Array<{ monthKey; count; entries }>`(시안의 "2026년 11월 2편"), 주간/월간 회고의 카드 머리(날짜 범위) 포맷.
- [ ] **Step 2~4**
- [ ] **Step 5: 화면** — 사이드바(회고, 주제, 폴더), 도구 막대(연도, 월, 주, 보기, 종류 거르기, 찾기, 요약 만들기, 새 회고), 카드, 레일 보기, 빈 화면 한 줄, 편집기, 새 회고 창.
- [ ] **Step 6: 확인 화면** + 375px
- [ ] **Step 7: Commit** `feat(retro): 회고 카드 목록, 레일, 편집기, 새 회고 창`

### Task 5: 회고 주제(목록, 본문, 연결 그래프, 정리 전)

시안: `d-retro2.html?area=topic...`의 기본값(`TVL=6`, `TVC=10`, `LG=1`, `HD=1`, `TF=2`, `SK=3`, `SW=1`, `GV=1`, `GN=5`, `GT=2`, `GP=3`), `shared/topicv.css`, `shared/tgraph.js`. 다른 값의 분기(`?tl=0`, `?scan=1` 등)는 옮기지 않는다. 확인: `?area=topic&tl=6`, `?area=topic&tvm=rail`, `?area=topic&tp=tp1`, `&tg=1`, `?area=topic&tp=tp4`.

**Files:**
- Create: `my-app/src/widgets/topic-studio/` (`index.ts`, `ui/{TopicStudio,TopicList,TopicCard,TopicRail,TopicDoc,TopicHeader,ThemeFilter,DayTimeline,TopicGraph,GraphSidePanel,TopicEmpty}.tsx`, `model/{structured.ts,structured.test.ts,graphModel.ts,graphModel.test.ts}`), `my-app/src/shared/lib/force-graph/{engine.ts,engine.test.ts}`(tgraph.js를 TS로), `my-app/src/app/styles/widgets/topic-v.css`, `my-app/src/shared/lib/i18n/modules/topic.ts`
- 데모 데이터: `demoTopicStructured`(시안 `d-retro2.html`의 TOPICS와 주제별 themes, 날짜별 항목, 근거)
- 기존 `widgets/retrospective-studio`의 주제 관련 파일(`TopicDocument`, `TopicsPane`, `TopicPillBar`, `TopicSourceListModal`, `useTopic*`)은 옮겨 쓰거나 지운다(지울 때 lint 오류도 같이 없어짐).

**Interfaces:**
- Consumes: `RetroRail`(Task 4), `RetroRouteParams`(Task 1), 기존 `shared/api/topics.ts`.
- Produces: `TopicStudio` (props: `topicId?: string; view?: "doc" | "graph"; onNavigate(params: RetroRouteParams)`).
  - `toTimeline(s: TopicStructured, sources: SourceMap, today: string): Array<{ weekLabel: "upcoming" | "thisWeek" | "lastWeek" | string; days: Array<{ dateKey; items: TimelineItem[] }> }>`
  - `buildGraph(s, sources, commits): { nodes: GraphNode[]; links: GraphLink[] }` (노드 종류 `tp | th | e | t | c`, 고리 반지름 순서 주제 → 큰 주제 → 회고 → 할 일 → 커밋)
  - 엔진: `createForceGraph(svg: SVGSVGElement, opts: { mode: "shape" | "glyph"; radial?: boolean; rings?: number[]; labels?: boolean; r0?: number }) → { set(data), fit(), zoom(k), select(id), hl(ids | null), screen(id), node(id), view(), auto(on), destroy() }`
- 실제 모드: `useServerFeature("topicStructured")`가 `false`면 본문은 기존 markdown 정리 결과를 새 머리(이름, 책갈피, 수) 아래에 보여 주고, 연결 전환 아이콘은 숨긴다.
- 주제 색: 목록 위치가 아니라 `createdAt` 순서로 `--tpc1..4`를 돌려 쓴다(`topicColorIndex(topics, id)`).

- [ ] **Step 1: 실패하는 테스트** — `toTimeline`(주 이름 나누기, 앞으로 할 일, 고른 큰 주제만 거르기), `buildGraph`(노드 수, 고리 순서, 근거 없는 항목 제외), `topicColorIndex`(주제를 지워도 다른 주제 색 유지), 엔진 `fit()`가 모든 노드를 화면 안에 넣음(jsdom 없이 계산 함수만).
- [ ] **Step 2~4**
- [ ] **Step 5: 화면** — 목록 카드(한 줄 두 장, 이름 주제 색, 책갈피), 넘기기, 본문(상단, 색 점 거르기, 주 이름 붙은 하루 카드, 왼쪽 여백 종류 아이콘, 자세히 보기), 문서/연결 아이콘, 그래프(동심원, 범례 겸 거르기, 옆 칸 큰 주제별 목록과 마우스 올리기), 정리 전/중.
- [ ] **Step 6: 확인 화면** 위 5개 + 움직임 줄이기 + 375px
- [ ] **Step 7: Commit** `feat(topic): 회고 주제 목록, 본문, 연결 그래프`

### Task 6: 설정 시트(전 섹션)

시안: `d-settings.html` 전체(섹션 8개: 계정, 일반, 할 일과 캘린더(일하는 시간 4번, 주 시작, 지난 일 표시, 캘린더와 태그 관리), 회고(템플릿 목록, 템플릿 작성 1번), AI 비서(빗금이 끄기 포함), 연동, 알림, 데이터와 보안), `shared/settings.css`. 확인: `d-settings.html`, `#link`, `#retro`, `?tedit=new:week#retro`, `#work`, `#ai`, `#data`.

**Files:**
- Create: `my-app/src/widgets/settings-sheet/` (`ui/{SettingsSheet,SectionNav,SettingsSearch,Row,Section*.tsx}`, `model/{sections.ts,search.ts,search.test.ts}`), `my-app/src/app/styles/widgets/settings-sheet.css`, `my-app/src/shared/lib/i18n/modules/settings.ts`
- Modify: Task 1의 `SettingsSheetHost`가 `SettingsSheet`를 렌더. 기존 `widgets/settings-studio`의 카드(`GithubCard`, `CalendarCard`, `TemplatesCard`, `SessionsCard`, `RegionTimezoneCard`, `TodoRangeCard` 등) 로직은 새 섹션 안으로 옮기고 껍데기는 지운다. `pages/settings`는 시트를 여는 경로 호환만.

**Interfaces:**
- Consumes: `useSettingsSheet`(Task 1), 기존 settings/github/calendar/templates/sessions API.
- 서버에 없는 줄(주 시작, 일하는 시간, 기본 길이, 하루 마무리 알림, 방해 금지, 알림 종류별 수신, 이메일 요약, 캘린더와 태그 관리, AI 비서 전체, 프로필 사진, 계정 삭제, 내보내기, 휴지통): `useServerFeature`(`settingsExt`, `notificationPrefs`, `userCalendars`, `tagAdmin`, `ai`, `avatar`, `accountDelete`, `exports`, `trash`)로 가림. 데모에서는 보이고 값은 화면 안 상태로만 바뀜.
- Produces: `searchSettings(q: string, locale: Locale): Array<{ section: SettingsSection; rowId: string }>`.

- [ ] **Step 1: 실패하는 테스트** `search.test.ts`: "주 시작" → `work` 섹션 행, 빈 검색 → 빈 배열, 실제 모드에서 가린 행은 결과에 없음.
- [ ] **Step 2~4**
- [ ] **Step 5: 화면** 8개 섹션과 템플릿 작성 1번
- [ ] **Step 6: 확인 화면** 위 6개 + 실제 모드(가린 줄 없는 모양) + 375px
- [ ] **Step 7: Commit** `feat(settings): 설정 시트 8개 섹션`

### Task 7: 로그인과 가입

시안: `d-auth.html`, `?v=signup`. 가운데 폼, Google과 GitHub 버튼은 이메일 입력 아래에 아이콘과 함께.

**Files:**
- Modify: `my-app/src/widgets/auth/ui/*`, `my-app/src/app/styles/widgets/auth.css`, `my-app/src/shared/lib/i18n/modules/auth.ts`(새 문구만)
- 동작(검증, OAuth 팝업, 오류 코드 매핑)은 바꾸지 않는다. 비밀번호 찾기와 재설정도 같은 모양으로.

- [ ] **Step 1: 화면** → **Step 2: 확인 화면**(로그인, 가입, 오류 상태, 375px) → **Step 3: Commit** `feat(auth): 로그인과 가입 화면`

### Task 8: 할 일 화면, 오른쪽 패널 탭, 하루 닫기

시안: `d-todos.html`(날짜별 열 보드), `shared/rpanel.js` + `shared/rpanel.css`(6번, 하루 2, 시간표, 시간 미정 처음 모양, 마감 2 일주일 띠, 커밋 4 세로 시간 줄), `panels.html`, `shared/carry3.js`(22번 하루 닫기와 회고 초안). 확인: `d-todos.html`, `d-calendar.html?rtab=day`, `?rtab=ut`, `?rtab=due`, `?rtab=cm`, `d-todos.html`의 시간표 탭, `d-calendar.html?close=1`, `d-todos.html?close=1`.

**Files:**
- Rewrite: `my-app/src/widgets/todo-board/ui/*`(날짜별 열, `TodoDetailPane` 제거, 상세는 `useTodoEditor`), `my-app/src/pages/todos/ui/TodosPage.tsx`(ShellPage + 캘린더 사이드바 재사용)
- Create: `my-app/src/widgets/right-panel-tabs/` (`ui/{DayTab,TimelineTab,UnscheduledTab,DueTab,CommitsTab}.tsx`, `model/{dayProgress.ts,dueBand.ts,*.test.ts}`, `register.ts`), `my-app/src/widgets/close-day/` (`ui/CloseDayDialog.tsx`, `model/{carryPlan.ts,carryPlan.test.ts}`), CSS와 i18n 모듈
- 사이드바의 "오늘 회고"와 하루 닫기 진입점 연결.

**Interfaces:**
- Consumes: `registerRightPanelTab`(Task 1), `CalendarSidebar`(Task 3, 할 일 화면도 같은 사이드바), `useTodoEditor`(Task 2), `canUseGithub`, 기존 `/github/commits`, `/todos`.
- Produces:
  - `dayProgress(todos: Todo[], now: Date): { current: Todo | null; next: Todo | null; nextInMin: number | null; rest: Todo[] }`
  - `dueBand(todos: Todo[], today: string): Array<{ dateKey; overdue: boolean; todos: Todo[] }>` (오늘 기준 일주일, 지난 마감은 앞에. 실제 모드의 지난 마감은 불러온 범위 안에서만 계산하고 `overdueQuery` 플래그가 켜지면 서버 조회로 바꿀 자리 표시)
  - `carryPlan(todos: Todo[], today: string, answers: CarryAnswers): Array<{ id; patch }>` (1차는 PATCH를 순서대로, `todoBatch` 플래그가 켜지면 묶음 API로 바꿀 자리)
- 커밋 탭은 `canUseGithub`일 때만.

- [ ] **Step 1: 실패하는 테스트** — `dayProgress`(지금 진행 중, 다음까지 분, 시간 미정은 rest), `dueBand`(지난 마감이 앞, 7일 경계), `carryPlan`(끝낸 것 제외, 내일로 옮김, 반복 할 일은 옮기지 않음)
- [ ] **Step 2~4**
- [ ] **Step 5: 화면** — 할 일 보드, 패널 탭 5개, 하루 닫기 두 단계
- [ ] **Step 6: 확인 화면** 위 목록 + 375px
- [ ] **Step 7: Commit** `feat(todos): 날짜별 보드, 오른쪽 패널 탭, 하루 닫기`

### Task 9: AI 탭과 빗금이

시안: `d-ai.html`의 확정값(`ap=2` 결과는 캘린더 미리보기, `bg=10` 인디고 빗금 모서리, 대화 중 절반으로 옅게, 알림 없음), `shared/ai.css`, `shared/aiv.css`, `shared/pet.js` + `shared/pet.css`(6번 빗금이: 오른쪽 아래 칸, 어느 화면에서나 부탁, 설정에서 끄기). 확인: `d-ai.html`, 입력 후 진행, 결과 미리보기와 표(넣음/뺌), 확인, `d-calendar.html?petopen=1`.

**Files:**
- Create: `my-app/src/widgets/ai-assistant/` (`ui/{AiHome,PromptBar,ProgressLine,ResultPreview,ProposalTable,HatchCorners}.tsx`, `model/{useAiSession.ts,demoScript.ts,proposal.ts,proposal.test.ts}`), `my-app/src/widgets/pet/` (`ui/{Pet,PetPopover}.tsx`, `model/petFrames.ts`), CSS, i18n 모듈
- Modify: `my-app/src/pages/ai/ui/AiPage.tsx`, Task 1의 `PetSlot`
- 빗금(Rough.js 모양): 런타임 라이브러리 금지. `roughjs`를 devDependency로 두고 `my-app/scripts/gen-pet-frames.mjs`로 SVG 경로를 미리 만들어 `petFrames.ts`에 커밋하거나, 시안의 모양을 손으로 만든 SVG 경로로 옮긴다. 둘 중 빌드 의존이 적은 쪽.

**Interfaces:**
- Consumes: `useServerFeature("ai")`(실제 모드에서 `false`면 AI 탭과 빗금이를 숨김), `useTodoEditor`, `EventCard`(Task 3, 결과 미리보기), `isDemoMode`.
- Produces: `applyProposal(todos: Todo[], p: Proposal, pickedKeys: string[]): { patches: TodoPatch[]; creates: NewTodo[]; undo: UndoRecord }`, `undoProposal(u: UndoRecord): ...` — 데모에서는 화면 안 상태로 적용, 실제 API는 만들지 않는다.
- 데모의 AI 응답은 `demoScript.ts`의 정해진 대본(입력 문장과 무관하게 같은 진행 문장과 제안). 시안의 규칙 기반 AI 흉내는 옮기지 않는다(명세 3장).

- [ ] **Step 1: 실패하는 테스트** `proposal.test.ts`: 고른 항목만 적용, 되돌리면 원래 값, `clash` 표시
- [ ] **Step 2~4**
- [ ] **Step 5: 화면** — 가운데 입력, 진행 문장, 캘린더 미리보기, 표, 확인, 모서리 빗금, 빗금이(움직임 줄이기 포함)
- [ ] **Step 6: 확인 화면** + 실제 모드(AI 탭 숨김)
- [ ] **Step 7: Commit** `feat(ai): AI 탭과 빗금이`

### Task 10: AI 추천(오른쪽 패널 탭, 캘린더 흐린 칸)

시안: `shared/rpanel.js`의 AI 추천(20번, 색 5번 인디고), `aisug.html`. 오른쪽 줄 AI 버튼으로 열면 캘린더에 반투명한 흐린 일정 칸(AI 표시)이 보이고 닫으면 사라짐. 칸에는 버튼이 없고 넣기, 넘기기는 종류별 목록에서. 확인: `d-calendar.html?aip=1`, `d-todos.html?aip=1`.

**Files:**
- Create: `my-app/src/widgets/ai-suggestions/` (`ui/{SuggestionsTab,SuggestionGroup}.tsx`, `model/{useSuggestions.ts,demoSuggestions.ts}`, `register.ts`), CSS, i18n 모듈
- Modify: 캘린더 `CalendarOverlaySlot`에 흐린 칸

**Interfaces:**
- Consumes: `registerRightPanelTab("ai", ...)`, `EventCard ghost`, `CalendarOverlaySlot`(Task 3), `useServerFeature("ai")`.
- 추천 데이터: 데모는 `demoSuggestions.ts`의 고정 목록(종류 `overdue`, `free_slot`, `commit_match`. `be-request` 11 §2와 같은 모양). 넣기, 넘기기는 화면 안 상태.

- [ ] **Step 1: 화면** → **Step 2: 확인 화면**(캘린더, 할 일, 패널 닫으면 흐린 칸 사라짐) → **Step 3: Commit** `feat(ai): AI 추천 패널과 캘린더 흐린 칸`

### Task 11: 통합 점검

- [ ] **Step 1:** `final.html`의 모든 항목을 시안과 앱(데모)에서 1440×900으로 찍어 나란히 비교, 다른 곳 목록.
- [ ] **Step 2:** 375px 넘침, 키보드만으로 셸 탭 이동, Esc 닫기, 움직임 줄이기.
- [ ] **Step 3:** 실제 모드(로그인 상태 흉내) 스크린샷: 서버에 없는 기능이 하나도 보이지 않는지.
- [ ] **Step 4:** 쓰지 않게 된 파일, CSS, i18n 키 정리. `pnpm build`, `pnpm test`, `pnpm lint`.
- [ ] **Step 5:** 이슈 기록 정리 후 Commit `chore(redesign): 통합 점검`
