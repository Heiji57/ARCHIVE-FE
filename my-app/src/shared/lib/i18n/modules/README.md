# 리디자인 기반 사용법 (Task 0)

리디자인 작업자가 같이 쓰는 것: i18n 모듈, 서버 기능 플래그, 토큰, 아이콘, 데모 데이터 자리, 테스트.

## 1. i18n 모듈

새 문구는 `keys.ts`와 `locales/*.ts`(16개)에 넣지 않는다. 기능마다 모듈 파일 하나를 만든다.

```ts
// src/shared/lib/i18n/modules/shell.ts
import { defineI18nModule } from "./types";

export const shellI18n = defineI18nModule({
  ko: {
    "shell.nav.calendar": "캘린더",
    "shell.search.count": "{n}개",
  },
  en: {
    "shell.nav.calendar": "Calendar",
    "shell.search.count": "{n} items",
  },
});
```

등록은 `modules/index.ts`에 한 줄 (파일 이름 알파벳 순 자리에 넣는다. 병렬 작업의 merge 충돌을 줄인다):

```ts
export { shellI18n } from "./shell";
```

규칙:

- 키 앞부분은 모듈 이름(`shell.`, `todoModal.` ...). 기존 `keys.ts` 키나 다른 모듈 키와 겹치면 `pnpm test`가 실패한다.
- `ko`와 `en`의 키 집합이 다르면(빠진 키, 더 있는 키) 컴파일 에러(`pnpm build`의 `tsc -b`).
- 값은 비우지 않는다. 한국어는 시안 문구 그대로, 영어는 번역.
- 나머지 14개 로케일(ja, zh, zh-TW, ...)은 모듈 키에 자동으로 `en` 값을 쓴다. 따로 할 일 없음.
- `{name}` 자리 표시는 기존과 같다: `t("shell.search.count", { n: 3 })`.
- 등록하면 `TranslationKey`에 키가 들어가서 `useTranslation().t(...)`, `translate(locale, ...)`에 그대로 쓴다. 등록하지 않은 키는 컴파일 에러.
- 테스트 전용 키는 모듈을 테스트 파일 안에서 `defineI18nModule`로 만들고 `index.ts`에 등록하지 않는다(실제 `TranslationKey`에 섞이지 않게). 병합 확인은 `mergeI18nModules(base, [testI18n])` (`./registry`).

파일: `types.ts`(`defineI18nModule`, `I18nModule`), `index.ts`(등록), `registry.ts`(`I18N_MODULES`, `ModuleTranslationKey`, `mergeI18nModules`), `index.test.ts`.

## 2. 서버 기능 플래그

서버(api.yaml)에 아직 없는 기능의 UI는 실제 모드에서 렌더하지 않는다. 데모 모드(`?demo=true`)에서는 보인다.

```tsx
import { useServerFeature } from "@/shared/lib/serverFeatures";

function TrashButton() {
  const on = useServerFeature("trash");
  if (!on) return null;
  return <button type="button">...</button>;
}
```

- 컴포넌트 밖(테스트, 순수 함수)에서는 `isServerFeatureOn("trash", { demo })`.
- 이름: `ai`, `userCalendars`, `tagAdmin`, `trash`, `exports`, `accountDelete`, `avatar`, `settingsExt`, `notificationPrefs`, `topicStructured`, `overdueQuery`, `todoBatch`, `commitRange`, `searchScope` (`type ServerFeature`).
- 실제 모드 값은 `SERVER_FEATURES`(지금 전부 `false`). 서버 연동이 끝난 기능만 `true`로 바꾼다.
- 새 이름이 필요하면 `ServerFeature`와 `SERVER_FEATURES`에 같이 더하고 `serverFeatures.test.ts`의 목록도 고친다.
- 데모 판별은 `isDemoMode()` (`@/shared/lib/demoMode`, `@/app/config/demo`에서도 다시 내보냄). 데모 모드에서 실제 API를 부르지 않는 기존 규칙(`apiActive`)은 그대로.

## 3. 토큰

`src/app/styles/tokens/redesign.css` (`index.css`가 토큰 묶음 끝에 import). 시안 `prototypes/linear-shell/shared/*.css`의 `:root` 이름과 값 그대로라서 시안 CSS의 `var(--...)`를 그대로 옮겨 쓸 수 있다. 색과 폰트는 이 토큰(또는 기존 `tokens/*.css`)으로만 쓴다.

| 묶음 (시안 파일) | 이름 |
|---|---|
| 셸 공통 (shared.css) | `--primary --primary-h --primary-a --ink --ink2 --ink3 --ink4 --canvas --s1 --s2 --s3 --s4 --line --line2 --done --warn --danger --font --mono --r --r2 --hh` (`--ink`, `--canvas`는 `colors.css`에 같은 값) |
| 회고 카드 (retro-cards.css) | `--rc-font --rc-mono --rc-surface(-hover/-active) --rc-rule(-strong/-faint) --rc-ink --rc-ink-2 --rc-ink-3 --rc-focus --rc-on-accent --rc-accent --rc-err --rc-err-well`, 종류 색 `--rc-{d,w,m,y}`와 `-well -tab -edge`, `--rc-s1..s5 --rc-radius --rc-radius-in --rc-dur` |
| 회고 주제 (topicv.css) | `--th1..4`, `--rc-t --rc-t-well`, `--tpc1..4 --tpw1..4`, `--sk-r --sk-rw --sk-t --sk-tw` |
| AI 탭 (ai.css) | `--ag-font --ag-num --ag-canvas --ag-surface(-2/-3) --ag-rule(-strong) --ag-ink(-2/-3/-4) --ag-accent(-hover/-ink/-soft/-text) --ag-focus --ag-ok --ag-warn --ag-shadow --ag-scrim --ag-s1..s7 --ag-r --ag-r-lg --ag-r-pill --ag-measure --ag-dur` |
| AI 추천 (aiv.css) | `--as-todo --as-retro --as-move --as-cal --as-git` |
| 오른쪽 패널 (rpanel.css) | `--rx-late --rx-soon --rx-ai-bg --ai --ai-soft` |
| 설정 (settings.css) | `--sx-scrim --sx-danger --sx-danger-soft --sx-ok --sx-warn --sx-note-bg --sx-note-line`, `--br-gc-{blue,dark,yellow,green,red,paper}` |
| 캘린더 사이드바 (sidevar.css) | `--sv-gc-{blue,dark,yellow,green,red,paper} --sv-warn-bg --sv-warn-line --sv-late --sv-late-bg` |
| 할 일 모달 (todomodal.css) | `--tm-warn-bg --tm-warn-line --tm-scrim --tm-danger-bg` |
| 할 일 상세 (tododetail.css) | `--td-late --td-late-bg --td-soon-bg --td-scrim` |
| 새 할 일 (newtodo.css) | `--nw-sh` |
| 상태 화면 (rest.css) | `--rs-shadow --rs-scrim` |
| 사용자 메뉴 (usermenu.css) | `--um-shadow --um-scrim --um-danger` |
| 빗금이 (pet.css) | `--pet-*`, `--hx-line --hx-edge --hx-bg --hx-eye` |
| 셸 주말 (planner.css) | `--we --we-h --sun --sat` |
| 이월/모달 변경 (lab3.css) | `--x-chg --x-chg-bg --x-over` |
| 할 일 상세 반복 (lab4.css) | `--z-scrim --z-danger-bg --z-ok --z-span` |

시안 CSS 안의 선택자 단위 변수(`--cols`, `--h` 등 :root 밖)는 토큰이 아니다. 컴포넌트 CSS에 그대로 둔다.
시안에 새 `:root` 값이 생기면 같은 묶음에 더하고, 기존 이름과 겹치면 `--rd-` 접두를 붙인다(`redesign.test.ts`가 겹침을 잡는다).

## 4. 아이콘

`@/shared/ui/icons`: `GithubIcon`, `RetroIcon`, `SettingsIcon`, `SparkIcon`, `ICON_STROKE`(1.7), `type IconProps`(`size` 기본 16, 나머지 svg 속성, 기본 `aria-hidden`).
시안 `A.ico`의 나머지는 lucide-react를 쓴다(대응표는 `icons/index.tsx` 주석). lucide도 시안처럼 `size={16} strokeWidth={ICON_STROKE}`.

## 5. 데모 데이터 자리

`src/app/config/demo-redesign/index.ts`. 기능마다 파일 하나(`demoCalendars` 등)를 만들고 `index.ts`에 한 줄로 내보낸다. app 레이어라 widgets/pages에서 직접 import하지 않는다(형식 주석 참고).

## 6. 테스트

`cd my-app && pnpm test` (Vitest, node 환경, `src/**/*.test.{ts,tsx}`, `@` alias 사용 가능). 컴포넌트 HTML 확인은 `react-dom/server`의 `renderToStaticMarkup` (예: `shared/ui/icons/icons.test.tsx`).
