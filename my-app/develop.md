# ARCHIVE — 프론트엔드 개발 문서

> AI 코드 어시스턴트 및 개발자가 이 프로젝트에서 착오 없이 개발하기 위한 참고 문서입니다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [개발 환경 세팅](#3-개발-환경-세팅)
4. [폴더 구조](#4-폴더-구조)
5. [아키텍처 — Feature-Sliced Design](#5-아키텍처--feature-sliced-design)
6. [상태 관리](#6-상태-관리)
7. [라우팅](#7-라우팅)
8. [국제화 (i18n)](#8-국제화-i18n)
9. [드래그 앤 드롭 (DnD)](#9-드래그-앤-드롭-dnd)
10. [컴포넌트 설계 규칙](#10-컴포넌트-설계-규칙)
11. [스타일링 시스템](#11-스타일링-시스템)
12. [핵심 데이터 타입](#12-핵심-데이터-타입)
13. [Mock 처리된 기능들](#13-mock-처리된-기능들)
14. [데이터 저장 전략 (PostgreSQL & Redis)](#14-데이터-저장-전략-postgresql--redis)

---

## 1. 프로젝트 개요

**ARCHIVE**는 할 일(Todo), 캘린더, 회고(Retrospective), 설정을 통합한 개인 생산성 관리 SPA입니다.

- 현재 프론트엔드 전용 (서버 없음)
- 모든 데이터는 `localStorage`에 저장 (`archive-app-state-v4` 키)
- GitHub 연동, AI 요약 등 일부 기능은 Mock 처리됨

---

## 2. 기술 스택

| 항목 | 버전 / 도구 |
|---|---|
| UI 라이브러리 | React `19.2.4` |
| 언어 | TypeScript `~6.0.2` |
| 빌드 도구 | Vite `^8.0.4` |
| 패키지 매니저 | **pnpm** `10.33.0` (npm/yarn 사용 금지) |
| 아이콘 | lucide-react `^1.14.0` |
| 린터 | ESLint 9 + typescript-eslint + react-hooks + react-refresh |
| 외부 UI 라이브러리 | **없음** (모든 UI는 직접 구현) |
| 상태 관리 라이브러리 | **없음** (useReducer + Context API) |
| 라우팅 라이브러리 | **없음** (window.history.pushState 직접 사용) |
| CSS 방식 | 전역 CSS 변수 + 유틸리티 클래스 (`src/app/styles/index.css`) |

> **중요**: 외부 상태 관리(Zustand, Redux 등), 라우팅(React Router 등), UI(MUI, shadcn 등) 라이브러리를 무단으로 추가하지 마세요.

---

## 3. 개발 환경 세팅

```bash
# 1. 의존성 설치 (반드시 pnpm 사용)
pnpm install

# 2. 개발 서버 실행 (http://localhost:5173)
pnpm dev

# 3. 타입 체크
pnpm build   # tsc -b && vite build

# 4. 린트
pnpm lint
```

### 경로 별칭

`tsconfig.json` 및 `vite.config.ts`에 `@` → `./src` 별칭이 설정되어 있습니다.

```ts
// 올바른 import
import { useArchiveApp } from "@/app/providers/useArchiveApp";

// 잘못된 import (상대 경로 사용 금지)
import { useArchiveApp } from "../../../app/providers/useArchiveApp";
```

---

## 4. 폴더 구조

```
src/
├── app/                        # 앱 진입점, 전역 설정, 상태 루트
│   ├── App.tsx                 # 최상위 컴포넌트
│   ├── config/                 # 데모 데이터, 초기 시드 상태
│   ├── lib/                    # 스케줄, 스토리지, 요약 유틸
│   ├── model/                  # 전역 타입, actions, reducer, settings
│   ├── providers/              # Context, AppProvider, 훅
│   ├── router/                 # 경로-라우트 매핑
│   └── styles/                 # 전역 CSS (index.css)
│
├── entities/                   # 도메인 엔티티 타입 & 순수 로직
│   ├── entry/                  # JournalEntry (회고 항목)
│   ├── github/                 # GitHubConfig
│   ├── notification/           # NotificationItem
│   ├── summary/                # PendingSummary
│   └── todo/                   # Todo, TaskStatus, UI 컴포넌트(StatusIcon)
│
├── pages/                      # 페이지 단위 진입점 (얇은 래퍼)
│   ├── calendar/
│   ├── todos/
│   ├── retrospectives/
│   └── settings/
│
├── shared/                     # 도메인 무관한 공용 코드
│   ├── lib/
│   │   ├── date.ts             # 날짜 유틸 함수
│   │   ├── id.ts               # createId() — nanoid 대신 직접 구현
│   │   ├── dnd/                # 커스텀 DnD (Pointer Events 기반)
│   │   └── i18n/               # 다국어 시스템
│   └── ui/                     # 재사용 UI 컴포넌트
│       ├── pill/               # <Pill>
│       ├── toggle-row/         # <ToggleRow>
│       ├── empty-state/        # <EmptyState>
│       ├── disconnect-banner/  # <DisconnectBanner>
│       └── index.ts            # barrel export
│
└── widgets/                    # 페이지에 배치되는 독립 UI 블록
    ├── app-shell/              # 전역 네비게이션 + 서브헤더
    ├── calendar-dashboard/     # 캘린더 (주간/월간 뷰)
    ├── todo-board/             # 칸반 보드
    ├── retrospective-studio/   # 회고 작성 화면
    ├── settings-studio/        # 설정 화면
    ├── global-search/          # 전역 검색
    ├── notifications/          # 알림 패널 + 토스트
    └── summary/                # AI 요약 오버레이 + 플로팅 칩
```

---

## 5. 아키텍처 — Feature-Sliced Design

이 프로젝트는 **FSD(Feature-Sliced Design)** 아키텍처를 따릅니다.

### 레이어 계층 (위 → 아래 방향으로만 import 가능)

```
app  →  pages  →  widgets  →  entities  →  shared
```

- **상위 레이어는 하위 레이어를 import할 수 있습니다.**
- **하위 레이어가 상위 레이어를 import하면 안 됩니다.**
- 같은 레이어 내 다른 슬라이스 간 import는 원칙적으로 금지입니다.
  - 예외: `widgets` 내에서 `app-shell`이 `global-search`, `notifications`를 사용하는 경우처럼 명확한 조합 관계는 허용합니다.

### 슬라이스 내부 구조 (widgets 기준)

각 widget은 아래 구조를 따릅니다:

```
widgets/[name]/
├── index.ts          # barrel export (외부에서는 여기서만 import)
├── model/
│   ├── constants.ts  # 상수, 타입
│   └── use[Name].ts  # 커스텀 훅 (비즈니스 로직 분리)
└── ui/
    ├── [Name].tsx    # 메인 컴포넌트 (조합만 담당, 100줄 이하 목표)
    └── [Sub].tsx     # 서브 컴포넌트들
```

### 외부에서 widget을 import하는 방법

```ts
// 올바름 — index.ts(barrel)를 통해 import
import { CalendarDashboard } from "@/widgets/calendar-dashboard";

// 잘못됨 — 내부 경로 직접 접근 금지
import { CalendarDashboard } from "@/widgets/calendar-dashboard/ui/CalendarDashboard";
```

---

## 6. 상태 관리

### 구조

```
AppProvider (Context.Provider)
  └── useReducer(appReducer, initialState)
        └── usePersistAppState → localStorage 자동 저장
```

### 사용법

컴포넌트에서 전역 상태에 접근할 때는 항상 `useArchiveApp()` 훅을 사용합니다.

```ts
import { useArchiveApp } from "@/app/providers/useArchiveApp";

function MyComponent() {
  const { state, addTodo, updateTodo, pushNotification } = useArchiveApp();
  // state.todos, state.entries, state.notifications, state.settings, state.githubConfig
}
```

### AppState 구조

```ts
interface PersistedAppState {
  todos: Todo[];                      // 할 일 목록
  entries: JournalEntry[];            // 회고 항목 목록
  githubConfig: GitHubConfig | null;  // GitHub 연동 설정
  notifications: NotificationItem[];  // 알림 목록
  settings: AppSettings;              // 앱 설정 (locale, autoSummary 등)
  pendingSummary: PendingSummary | null; // 진행 중인 AI 요약
}
```

### localStorage 키

```
archive-app-state-v4
```

> 스키마 변경 시 키의 버전(`v4`)을 올려야 합니다.

### Action 네이밍 규칙

`도메인/동사` 형태를 따릅니다.

```ts
"todo/add" | "todo/update" | "todo/move"
"entry/update" | "entry/upsert"
"github/save"
"notification/push" | "notification/markRead" | "notification/clearAll" ...
"settings/locale" | "settings/autoSummary" | "settings/retention"
"summary/start" | "summary/minimize" | "summary/complete" | "summary/cancel"
```

---

## 7. 라우팅

외부 라우팅 라이브러리 없이 `window.history.pushState`를 직접 사용합니다.

### 라우트 정의

```ts
type AppRoute = "calendar" | "todos" | "retrospectives" | "settings";
```

### 경로 매핑

| AppRoute | URL 경로 |
|---|---|
| `calendar` | `/` |
| `todos` | `/todos` |
| `retrospectives` | `/retrospectives` |
| `settings` | `/settings` |

### 내비게이션

```ts
// AppShell 또는 CalendarPage 등에서 onNavigate prop으로 전달됨
onNavigate("todos");  // URL 변경 + 상태 전환
```

---

## 8. 국제화 (i18n)

### 지원 언어

| 코드 | 언어 |
|---|---|
| `ko` | 한국어 (기본값) |
| `en` | English |
| `zh` | 中文 (简体) |
| `ja` | 日本語 |

### 사용법

```tsx
import { useTranslation } from "@/shared/lib/i18n";

function MyComponent() {
  const { t } = useTranslation();
  return <p>{t("nav.calendar")}</p>;
  // 보간: t("sync.minutesAgo", { n: 5 }) → "5분 전"
}
```

### 번역 키 추가 방법

`src/shared/lib/i18n/dictionaries.ts`에서 작업합니다.

1. `TranslationKey` union 타입에 새 키 추가
2. `ko`, `en`, `zh`, `ja` 딕셔너리에 각각 번역 추가

```ts
// 1. 타입 추가
export type TranslationKey =
  | "existing.key"
  | "my.new.key";   // 추가

// 2. 각 언어 딕셔너리에 추가
const ko = { "my.new.key": "새 번역" };
const en = { "my.new.key": "New translation" };
// ...
```

> `TranslationKey`에 없는 키를 `t()`에 전달하면 **TypeScript 컴파일 에러**가 발생합니다.

---

## 9. 드래그 앤 드롭 (DnD)

외부 라이브러리 없이 **Pointer Events API** 기반으로 직접 구현되어 있습니다.

### 구성 요소

```
shared/lib/dnd/
├── DndContext.tsx   # DndProvider, useDnd, DragKind, DragPayload
├── useDraggable.ts  # 드래그 가능한 요소에 사용
└── useDropTarget.ts # 드롭 대상 요소에 사용
```

### 사용 패턴

```tsx
import { useDraggable, useDropTarget } from "@/shared/lib/dnd";

// 드래그 가능한 컴포넌트
function DraggableItem({ id }) {
  const { draggableProps, isDragging } = useDraggable({
    kind: "TODO_DRAG",  // DragKind — 타입 구분용 문자열
    payload: { id },
  });
  return <div {...draggableProps} style={{ opacity: isDragging ? 0.5 : 1 }}>...</div>;
}

// 드롭 대상 컴포넌트
function DropZone({ dateKey }) {
  const { dropTargetProps, isOver } = useDropTarget({
    accepts: "TODO_DRAG",
    onDrop: (payload) => moveTodo(payload.id, dateKey),
  });
  return <div {...dropTargetProps}>...</div>;
}
```

> `DndProvider`는 `App.tsx`의 `DndProvider` 래퍼 안에서만 동작합니다. 새 드래그 종류를 추가할 때는 `DragKind` 타입을 확장해야 합니다.

---

## 10. 컴포넌트 설계 규칙

### 파일 크기 목표

| 파일 역할 | 목표 줄 수 |
|---|---|
| 메인 위젯 컴포넌트 (조합) | 100줄 이하 |
| 서브 컴포넌트 | 150줄 이하 |
| 커스텀 훅 | 80줄 이하 |
| constants 파일 | 제한 없음 |

### React.memo 사용 기준

리스트에서 반복 렌더링되는 아이템 컴포넌트에만 적용합니다.

```ts
// 적용 대상 예시
export const KanbanCard = memo(function KanbanCard(...) { ... });
export const RetroListItem = memo(function RetroListItem(...) { ... });
export const DraggableTaskCard = memo(function DraggableTaskCard(...) { ... });
```

### 공용 UI 컴포넌트

`shared/ui`에 있는 컴포넌트를 우선 사용하세요.

```ts
import { Pill, ToggleRow, EmptyState, DisconnectBanner } from "@/shared/ui";
```

| 컴포넌트 | Props | 용도 |
|---|---|---|
| `<Pill>` | `label`, `color?`, `size?` | 상태 배지, 태그 |
| `<ToggleRow>` | `label`, `on`, `onChange` | iOS 스타일 토글 행 |
| `<EmptyState>` | `message`, `minHeight?`, `fontSize?` | 빈 목록 안내 |
| `<DisconnectBanner>` | `message`, `style?` | 연결 해제 안내 |

### 비즈니스 로직 분리 원칙

- **컴포넌트**: 렌더링과 이벤트 연결만 담당
- **커스텀 훅 (`model/use*.ts`)**: 상태, 파생 데이터, 사이드 이펙트
- **constants (`model/constants.ts`)**: 상수, 설정 객체, 정적 타입

```ts
// 좋은 예
function TodoBoard() {
  const { filter, grouped } = useKanbanFilter(state.todos);  // 로직은 훅에
  return <div>{COLS.map(col => <KanbanColumn items={grouped[col.id]} />)}</div>;
}

// 나쁜 예 — 컴포넌트 안에 필터/정렬 로직 직접 작성
```

---

## 11. 스타일링 시스템

모든 스타일은 `src/app/styles/index.css`의 CSS 변수와 유틸리티 클래스를 사용합니다.

### 주요 CSS 변수

```css
/* 색상 */
--color-bg              /* 페이지 배경 */
--color-tile-1          /* 카드 배경 1단계 */
--color-tile-2          /* 카드 배경 2단계 */
--color-body            /* 본문 텍스트 */
--color-body-muted      /* 보조 텍스트 */
--color-accent          /* 강조색 */
--color-divider-soft    /* 구분선 */

/* 상태 색상 */
--color-status-done         /* 완료 */
--color-status-in-progress  /* 진행 중 */
--color-status-not-start    /* 시작 전 */

/* 간격/반경 */
--r-sm, --r-md, --r-lg, --r-xl   /* border-radius */
```

### 주요 유틸리티 클래스

```css
.page           /* 페이지 컨텐츠 영역 (max-width, 좌우 패딩) */
.t-eyebrow      /* 소제목 텍스트 스타일 */
.t-hero         /* 대형 제목 텍스트 */
.btn-icon       /* 아이콘 버튼 */
.badge-dot      /* 빨간 알림 점 */
.sync-dot       /* 동기화 상태 점 (온라인/오프라인) */
.dashed         /* 점선 테두리 (EmptyState 등) */
```

> inline 스타일(`style={{ ... }}`)은 CSS 변수에 없는 1회성 수치(레이아웃 수치 등)에만 사용하세요. 색상은 반드시 CSS 변수를 사용합니다.

---

## 12. 핵심 데이터 타입

### Todo

```ts
interface Todo {
  id: string;           // "todo_xxxxxxxx" 형식
  title: string;
  completed: boolean;   // status === "done"과 동기화됨
  dateKey: string;      // "YYYY-MM-DD" 형식
  createdAt: string;    // ISO 8601
  completedAt: string | null;
  status: "done" | "in-progress" | "not-start";
  description: string;
}
```

### JournalEntry (회고)

```ts
interface JournalEntry {
  id: string;           // "entry_xxxxxxxx" 형식
  dateKey: string;      // "YYYY-MM-DD"
  title: string;
  content: string;      // 회고 본문 (학습/메모)
  retroType: "daily" | "weekly" | "monthly" | "yearly";
  synced: boolean;      // GitHub에 동기화 여부 (현재 mock)
  updatedAt: string;    // ISO 8601
}
```

### ID 생성

```ts
import { createId } from "@/shared/lib/id";

const id = createId("todo");    // "todo_a1b2c3d4"
const id = createId("entry");   // "entry_a1b2c3d4"
```

---

## 13. Mock 처리된 기능들

아래 기능들은 현재 가짜 데이터 또는 딜레이로 처리되어 있습니다. 실제 서버 연동 시 교체가 필요합니다.

| 기능 | 위치 | 현재 상태 | 교체 방향 |
|---|---|---|---|
| GitHub OAuth 연결 | `settings-studio/model/constants.ts` | `DEMO_GITHUB` 하드코딩 | FastAPI OAuth 엔드포인트 |
| GitHub 커밋 조회 | `retrospective-studio/model/constants.ts` | `MOCK_COMMITS` 배열 | GitHub API (서버 경유) |
| AI 자동 요약 생성 | `app/model/reducer.ts` (`summary/start`) | 6초 setTimeout mock | Anthropic/OpenAI API (서버 경유) |
| 자동 일정 트리거 | `app/lib/scheduleSummary.ts` | 앱 실행 시 1회 체크 | 서버 Cron Job |
| 데이터 영속성 | `app/lib/storage.ts` | localStorage만 | 서버 DB (PostgreSQL) |

---

## 14. 데이터 저장 전략 (PostgreSQL & Redis)

현재 프론트엔드는 `localStorage`만 사용하지만, 백엔드 구축 시 아래 전략을 따릅니다.

### 저장소 선택 원칙

```
PostgreSQL  →  영속성이 필요한 데이터 (삭제되면 안 되는 것)
Redis       →  모든 API 요청마다 조회되거나, 외부 API 비용을 아껴야 하는 캐시
```

> Redis는 전체 데이터를 메모리에 올리는 구조이므로 **TTL이 없는 전체 유저 데이터**를 저장하지 않습니다.
> 단순 PK 조회로 충분한 데이터(`user_streaks` 등)는 Redis가 아닌 PostgreSQL에서 직접 조회합니다.

---

### PostgreSQL — 18개 테이블

#### 테이블 관계 구조

```
users (루트)
├── user_settings               (1:1)
├── oauth_connections           (1:N) ← 소셜 로그인 수단
├── refresh_tokens              (1:N) ← 토큰 발급 이력 추적 (인증은 Redis)
├── github_configs              (1:1) ← GitHub 데이터 연동
│     └── tracked_repositories (1:N)
├── todos                       (1:N)
│     └── todo_status_logs     (1:N)
├── journal_entries             (1:N)
│     └── ai_summary_jobs      (1:N)
│           └── ai_summary_feedback (1:1)
├── notifications               (1:N)
├── push_subscriptions          (1:N)
├── feature_usage_events        (1:N)
├── daily_productivity_snapshots (1:N)
├── user_streaks                (1:1)
├── payment_history             (1:N)
└── user_goals                  (1:N)
```

---

#### 코어 도메인 (11개)

**`users`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `email` | `VARCHAR(255)` | N | UNIQUE |
| `password_hash` | `VARCHAR(255)` | **Y** | 소셜 전용 유저는 없음 |
| `totp_secret` | `VARCHAR(255)` | Y | 2FA 미설정 시 NULL |
| `totp_enabled` | `BOOLEAN` | N | DEFAULT false |
| `plan` | `ENUM('free','pro')` | N | DEFAULT 'free' |
| `plan_expires_at` | `DATETIME` | Y | |
| `created_at` | `DATETIME` | N | |
| `updated_at` | `DATETIME` | N | |

---

**`user_settings`** — users 1:1, `user_id` = PK

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `user_id` | `VARCHAR(36)` | N | PK, FK → users |
| `locale` | `ENUM('ko','en','zh','ja')` | N | DEFAULT 'ko' |
| `auto_summary_weekly` | `BOOLEAN` | N | DEFAULT true |
| `auto_summary_monthly` | `BOOLEAN` | N | DEFAULT true |
| `auto_summary_yearly` | `BOOLEAN` | N | DEFAULT true |
| `notification_retention_days` | `INT` | N | DEFAULT 30 |
| `last_schedule_check_at` | `DATETIME` | Y | |
| `updated_at` | `DATETIME` | N | |

---

**`oauth_connections`** — 소셜 로그인 수단 관리 (github_configs와 역할 다름)

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `provider` | `ENUM('github','google')` | N | |
| `provider_user_id` | `VARCHAR(255)` | N | UNIQUE(provider, provider_user_id) |
| `access_token` | `TEXT` | N | 암호화 저장 |
| `created_at` | `DATETIME` | N | |
| `updated_at` | `DATETIME` | N | |

> `oauth_connections` vs `github_configs` 구분
> - `oauth_connections`: **로그인 수단** — "GitHub 계정으로 로그인"
> - `github_configs`: **데이터 연동** — "GitHub 커밋을 회고에 가져오기"
>
> 소셜 로그인 계정 연결 흐름:
> 1. OAuth 로그인 시도 → `provider_user_id`로 `oauth_connections` 검색
> 2. 있으면: 해당 `user_id`로 로그인
> 3. 없으면: 동일 이메일 계정 존재 시 "기존 계정으로 로그인 후 연결" 안내 / 신규면 계정 생성

---

**`refresh_tokens`**

> **역할 구분 — Redis vs PostgreSQL**
>
> | | Redis | PostgreSQL (`refresh_tokens`) |
> |---|---|---|
> | 목적 | **실제 인증** — 토큰 유효성 검증 | **이력 추적** — 발급/사용/폐기 감사 |
> | 저장 데이터 | `token_hash → user_id` | 디바이스 정보, 마지막 사용 시각, 폐기 시각 |
> | 조회 시점 | 모든 API 요청 | 보안 감사, 강제 로그아웃, 이상 탐지 |
> | 만료 처리 | TTL 자동 삭제 | `expires_at` / `revoked_at` 컬럼으로 관리 |
>
> 인증 흐름에서 PostgreSQL `refresh_tokens`는 조회하지 않습니다. Redis 캐시 MISS 시에도 재발급 처리이며, DB 조회는 하지 않습니다.

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK, `rtkn_{uuid7}` 형식 |
| `user_id` | `VARCHAR(36)` | N | FK → users ON DELETE CASCADE |
| `token_hash` | `VARCHAR(255)` | N | UNIQUE, SHA-256 해시 (평문 저장 안 함) |
| `device_info` | `TEXT` | Y | User-Agent, IP 등 |
| `expires_at` | `DATETIME` | N | DEFAULT now() + 7일 |
| `revoked_at` | `DATETIME` | Y | 강제 폐기 시각. NULL이면 유효 |
| `last_used_at` | `DATETIME` | Y | Rotation 추적용 |
| `created_at` | `DATETIME` | N | |

활용 예시:
- **이상 탐지**: 동일 토큰이 서로 다른 IP에서 단시간에 사용된 경우 감지
- **강제 로그아웃**: `revoked_at`을 현재 시각으로 UPDATE + Redis 키 삭제
- **디바이스 관리**: 유저가 "연결된 기기 목록"을 조회하고 특정 기기를 로그아웃

---

**`todos`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `title` | `VARCHAR(500)` | N | |
| `status` | `ENUM('not-start','in-progress','done')` | N | DEFAULT 'not-start' |
| `completed` | `BOOLEAN` | N | status='done'과 동기화 |
| `date_key` | `VARCHAR(10)` | N | 'YYYY-MM-DD' |
| `description` | `TEXT` | N | DEFAULT '' |
| `created_at` | `DATETIME` | N | |
| `completed_at` | `DATETIME` | Y | |
| `updated_at` | `DATETIME` | N | |

---

**`journal_entries`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `date_key` | `VARCHAR(10)` | N | **UNIQUE(user_id, date_key)** — 하루 1개 강제 |
| `title` | `VARCHAR(500)` | N | |
| `content` | `TEXT` | N | |
| `retro_type` | `ENUM('daily','weekly','monthly','yearly')` | N | |
| `synced` | `BOOLEAN` | N | GitHub 동기화 여부 |
| `created_at` | `DATETIME` | N | |
| `updated_at` | `DATETIME` | N | |

---

**`github_configs`** — users 1:1, `user_id` = PK (데이터 연동 전용)

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `user_id` | `VARCHAR(36)` | N | PK, FK → users |
| `encrypted_token` | `TEXT` | N | AES-256 암호화 |
| `owner` | `VARCHAR(255)` | N | |
| `repo` | `VARCHAR(255)` | N | |
| `enabled` | `BOOLEAN` | N | |
| `connected_as` | `VARCHAR(255)` | Y | |
| `target_repository` | `VARCHAR(255)` | Y | |
| `auto_retrospective_enabled` | `BOOLEAN` | N | DEFAULT false |
| `last_synced_at` | `DATETIME` | Y | |
| `created_at` | `DATETIME` | N | |
| `updated_at` | `DATETIME` | N | |

---

**`tracked_repositories`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `github_user_id` | `VARCHAR(36)` | N | FK → **github_configs(user_id)** ON DELETE CASCADE |
| `repo_name` | `VARCHAR(255)` | N | |
| `enabled` | `BOOLEAN` | N | |

> FK가 `users`가 아닌 `github_configs`를 참조하는 이유:
> GitHub 연결 해제 시 `github_configs` 행이 삭제되면 추적 레포도 CASCADE로 자동 삭제됩니다.

---

**`notifications`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `type` | `ENUM('success','info','warning')` | N | |
| `category` | `ENUM('general','summary','sync','system')` | N | |
| `title` | `VARCHAR(255)` | N | |
| `message` | `TEXT` | N | |
| `is_read` | `BOOLEAN` | N | DEFAULT false |
| `created_at` | `DATETIME` | N | |

---

**`ai_summary_jobs`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `kind` | `ENUM('weekly','monthly','yearly')` | N | |
| `target_date_key` | `VARCHAR(10)` | N | |
| `status` | `ENUM('pending','processing','completed','failed')` | N | DEFAULT 'pending' |
| `journal_entry_id` | `VARCHAR(36)` | Y | FK → journal_entries ON DELETE SET NULL |
| `error_message` | `TEXT` | Y | |
| `started_at` | `DATETIME` | N | |
| `completed_at` | `DATETIME` | Y | |

---

**`push_subscriptions`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `endpoint` | `TEXT` | N | |
| `p256dh` | `TEXT` | N | VAPID 공개키 |
| `auth` | `TEXT` | N | |
| `created_at` | `DATETIME` | N | |

---

#### 비즈니스 분석 (6개)

**`todo_status_logs`** — 할 일 상태 변경 이력

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `todo_id` | `VARCHAR(36)` | N | FK → todos ON DELETE CASCADE |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `from_status` | `ENUM('not-start','in-progress','done')` | N | |
| `to_status` | `ENUM('not-start','in-progress','done')` | N | |
| `changed_at` | `DATETIME` | N | |

---

**`feature_usage_events`** — 기능별 사용 이벤트 로그

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `event_name` | `VARCHAR(100)` | N | 예: `ai_summary_requested` |
| `properties` | `JSON` | Y | 이벤트별 추가 데이터 |
| `occurred_at` | `DATETIME` | N | |

---

**`daily_productivity_snapshots`** — 일별 생산성 집계, 복합 PK

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `user_id` | `VARCHAR(36)` | N | PK + FK → users |
| `date_key` | `VARCHAR(10)` | N | PK |
| `todos_created` | `INT` | N | DEFAULT 0 |
| `todos_completed` | `INT` | N | DEFAULT 0 |
| `retros_written` | `INT` | N | DEFAULT 0 |
| `commits_linked` | `INT` | N | DEFAULT 0 |
| `ai_summaries_generated` | `INT` | N | DEFAULT 0 |

활동 발생 시 Redis 버퍼 없이 PostgreSQL UPSERT로 직접 처리합니다:
```sql
INSERT INTO daily_productivity_snapshots (user_id, date_key, todos_completed)
VALUES ('user_01', '2026-05-23', 1)
ON CONFLICT (user_id, date_key)
DO UPDATE SET todos_completed = daily_productivity_snapshots.todos_completed + 1;
```

---

**`user_streaks`** — users 1:1, `user_id` = PK

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `user_id` | `VARCHAR(36)` | N | PK, FK → users |
| `current_streak` | `INT` | N | DEFAULT 0 |
| `longest_streak` | `INT` | N | DEFAULT 0 |
| `last_active_date` | `VARCHAR(10)` | Y | 'YYYY-MM-DD' |
| `streak_started_at` | `DATE` | Y | |
| `updated_at` | `DATETIME` | N | |

---

**`ai_summary_feedback`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `ai_summary_job_id` | `VARCHAR(36)` | N | FK → ai_summary_jobs |
| `rating` | `TINYINT` | N | 1~5 |
| `feedback_text` | `TEXT` | Y | |
| `created_at` | `DATETIME` | N | |

---

**`payment_history`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `plan` | `ENUM('free','pro')` | N | |
| `amount` | `INT` | N | |
| `currency` | `VARCHAR(3)` | N | DEFAULT 'KRW' |
| `payment_method` | `VARCHAR(50)` | Y | |
| `status` | `ENUM('pending','completed','failed','refunded')` | N | DEFAULT 'pending' |
| `period_start` | `DATE` | N | |
| `period_end` | `DATE` | N | |
| `paid_at` | `DATETIME` | Y | |
| `created_at` | `DATETIME` | N | |

---

#### 유저 인게이지먼트 (1개)

**`user_goals`**

| 컬럼 | 타입 | Null | 비고 |
|---|---|---|---|
| `id` | `VARCHAR(36)` | N | PK |
| `user_id` | `VARCHAR(36)` | N | FK → users |
| `period_type` | `ENUM('weekly','monthly')` | N | |
| `period_key` | `VARCHAR(10)` | N | UNIQUE(user_id, period_type, period_key) |
| `goal_todos` | `INT` | N | DEFAULT 0 |
| `goal_retros` | `INT` | N | DEFAULT 0 |
| `actual_todos` | `INT` | N | DEFAULT 0 |
| `actual_retros` | `INT` | N | DEFAULT 0 |
| `created_at` | `DATETIME` | N | |
| `updated_at` | `DATETIME` | N | |

---

### ENUM 전체 목록

프론트에서 이 값 외의 문자열을 전송하면 서버에서 **422** 를 반환합니다.

| 테이블.컬럼 | 허용 값 |
|---|---|
| `users.plan` | `free` / `pro` |
| `user_settings.locale` | `ko` / `en` / `zh` / `ja` |
| `oauth_connections.provider` | `github` / `google` |
| `todos.status` | `not-start` / `in-progress` / `done` |
| `journal_entries.retro_type` | `daily` / `weekly` / `monthly` / `yearly` |
| `notifications.type` | `success` / `info` / `warning` |
| `notifications.category` | `general` / `summary` / `sync` / `system` |
| `ai_summary_jobs.kind` | `weekly` / `monthly` / `yearly` |
| `ai_summary_jobs.status` | `pending` / `processing` / `completed` / `failed` |
| `todo_status_logs.from_status` | `not-start` / `in-progress` / `done` |
| `todo_status_logs.to_status` | `not-start` / `in-progress` / `done` |
| `user_goals.period_type` | `weekly` / `monthly` |
| `payment_history.plan` | `free` / `pro` |
| `payment_history.status` | `pending` / `completed` / `failed` / `refunded` |

---

### Redis — 4가지

Redis에는 TTL이 있거나 요청마다 조회되는 소량의 데이터만 저장합니다.

#### 1. Refresh Token (인증 전용)
```
키:  refresh_token:{token_hash}
값:  user_id
TTL: 7일
```
**인증 용도로만 사용합니다.** 토큰의 발급 이력, 디바이스 정보, 폐기 여부는 PostgreSQL `refresh_tokens` 테이블에서 관리합니다.

| 시나리오 | Redis | PostgreSQL |
|---|---|---|
| API 요청 인증 | token_hash → user_id 조회 | 조회 안 함 |
| 로그아웃 | 키 삭제 | `revoked_at` UPDATE |
| 강제 폐기 | 키 삭제 | `revoked_at` UPDATE |
| 디바이스 목록 조회 | 조회 안 함 | `refresh_tokens` SELECT |

#### 2. Rate Limiting 카운터
```
키:  rate_limit:{user_id}:{endpoint}
값:  정수 (요청 횟수)
TTL: 60초
```

| 엔드포인트 | 제한 | 이유 |
|---|---|---|
| `POST /ai/summary` | 분당 3회 | Anthropic API 비용 |
| `GET /github/commits` | 분당 10회 | GitHub API 할당량 |
| `POST /auth/login` | 분당 5회 | 브루트포스 방지 |
| `POST /auth/register` | 시간당 3회 | 계정 남용 방지 |

```
INCR rate_limit:{user_id}:{endpoint}
→ 결과 > 제한치  →  429 반환
→ 결과 <= 제한치 →  요청 처리, EXPIRE 60 설정
```

#### 3. 멤버십 상태 캐시
```
키:  membership:{user_id}
값:  "free" | "pro"
TTL: 5분
```
모든 API 요청 인증 미들웨어에서 플랜 확인. 매번 PostgreSQL 조회 시 DB 부하 발생 → 5분 캐싱. 플랜 변경 시 즉시 키 삭제(invalidate).

#### 4. GitHub 커밋 캐시
```
키:  github:commits:{user_id}:{repo_name}
값:  JSON 배열
TTL: 1시간
```
GitHub API 인증 요청 시간당 5,000회 제한. 회고 화면 진입 시마다 호출하지 않도록 캐싱.

---

*최종 업데이트: 2026-05-24*
