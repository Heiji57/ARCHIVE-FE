# BE 작업 요청 초안 — 앱 리디자인 (2026-11-10)

> **대체됨 (2026-11-13).** 도메인별 문서 `docs/be-request-2026-11-13-redesign/`로 옮겼다.
> 구현 단계와 이 문서의 묶음 A~G가 어디로 갔는지는 그 폴더의 `README.md`에 있다. 이 문서는 기록으로만 남긴다.

> **상태: 초안.** FE 명세 5장의 결정이 끝나면 확정한다. 필드 이름은 제안이고, BE 저장소의
> 계획 절차(`CLAUDE.md`의 Pre-Implementation Workflow)에서 최종 확정한다.

관련 FE 문서: `docs/superpowers/specs/2026-11-10-app-redesign-publishing-design.md`

현재 `api.yaml`과 BE 코드(`src/app/*`)를 대조했다. BE에 대화형 AI, 추천, 묶음 수정,
사용자 캘린더는 없고, Gemini 연동은 회고 요약과 주제 임베딩에만 쓰인다.

## 바꾸지 않아도 되는 것

| 기능 | 쓰는 API |
|---|---|
| 할 일 날짜, 시간, 상태, 태그, 기간, 반복 | `/todos`, `PATCH /todos/{id}` (`recurrence_scope`) |
| 커밋 탭 | `GET /github/commits?date=` |
| Google 일정 표시 | `/calendar/events`, `/calendar/connection` |
| Google 보내기 재시도 | `POST /todos/{id}/calendar-link` (멱등) |
| GitHub 권한 안내 | `GET /github/connection`의 `hasVerifiedEmails` |
| 회고, 폴더, 주제, 템플릿, 요약, 세션, 검색 | 기존 그대로 |

## 우선순위

| 순서 | 묶음 | 필요한 FE 단계 |
|---|---|---|
| P0 | A. 묶음 수정, B. 지난 마감과 실패 조회 | 3, 4단계 |
| P1 | C. 설정 확장 | 5단계 |
| P2 | D. 사용자 캘린더, E. 태그 관리 (제품 결정 후) | 6단계 |
| P3 | F. AI | 7단계 |
| P4 | G. 계정과 데이터 | 8단계 |

---

아래 블록을 ARCHIVE-BE 작업 세션에 붙여넣는다.

```
ARCHIVE 프론트엔드 리디자인에 필요한 API를 추가해줘. 구현 전에 CLAUDE.md 절차대로 계획부터
제시하고, 묶음별로 승인받은 뒤 진행해줘. 끝나면 api.yaml을 갱신해줘.

## A. 할 일 묶음 수정 (P0)

하루 닫기, "모두 하기", 한 번에 되돌리기에 쓴다. 일부만 성공하면 안 된다.

POST /todos/batch
요청: { "operations": [ { "id": "...", "patch": TodoUpdateRequest } ] }
- patch는 기존 PATCH /todos/{id}와 같은 규칙. 반복 할 일의 recurrence_scope 포함
- 전체를 한 트랜잭션으로 처리. 하나라도 실패하면 모두 취소하고 실패한 id를 details에 담는다
- 응답: { "todos": TodoResponse[], "previous": TodoResponse[] }
  previous는 되돌리기용 변경 전 값
- 상한: 한 번에 100개
- Google Calendar push는 건별 기존 흐름을 유지

## B. 로드 범위 밖의 할 일 조회 (P0)

FE는 일정 범위만 불러오므로, 오래전에 마감이 지난 일과 Google 보내기 실패를 놓친다.

GET /todos에 선택 파라미터 추가 (기존 dateKey, from, to와 별개로 동작)
- overdue=true: due_date_key가 오늘보다 이전이고(없으면 date_key 기준) done이 아닌 할 일.
  오늘 판단은 사용자 시간대 기준
- calendar_push_status=failed: Google 보내기 실패 항목
- 페이지네이션이 필요하면 기존 page, size 규칙을 따른다

## C. 설정 확장 (P1)

GET /settings, PUT /settings에 추가. 서버가 읽는 값은 컬럼, 화면 전용 값은 JSONB를 제안.

| 필드 | 타입 | 쓰임 |
|---|---|---|
| weekStart | mon, sun | 달력, 주간 회고 경계 |
| workSchedule | { days: number[], perDay: { "1": {from, to} } } | 일하는 시간. AI가 일정을 잡을 때 사용 |
| defaultTodoMinutes | number | 길이 없는 할 일 기본값 |
| dayEndReminder | { enabled, at: "HH:mm" } | 하루 마무리 알림 (서버 스케줄) |
| notificationPrefs | { due, summary, schedule, sync: boolean } | 알림 종류별 수신 |
| quietHours | { enabled, from, to } | 방해 금지. 그동안 알림을 모았다가 끝나면 전달 |
| uiPreferences | JSONB | startTab, timeFormat, doneDisplay, defaultRetroFolderId |

알림 카테고리는 지금 sync, summary, system뿐이다. 마감 알림과 예약 알림이 구분되도록
NotificationCategory에 due, schedule 추가가 필요하다.

## D. 사용자 캘린더 (P2, 제품 결정 후)

- calendars 테이블: id, user_id, name, color, sort_order, is_default
- GET, POST /calendars / PATCH, DELETE /calendars/{id}. 기본 캘린더는 삭제 불가
- todos.calendar_id (nullable, null이면 기본 캘린더). Todo 생성, 수정, 응답에 추가
- 마이그레이션에서 사용자별 기본 캘린더 생성

## E. 태그 관리 (P2)

태그는 지금 todos.tags 문자열 배열이다.

- user_tags: user_id, name, color, sort_order
- GET /todos/tags: 전체 목록과 개수, 색, 순서
- PATCH /todos/tags/{name}: 이름, 색, 순서. 이름을 바꾸면 해당 사용자의 todos.tags도 일괄 변경
- DELETE /todos/tags/{name}: 모든 할 일에서 제거

## F. AI (P3)

원칙: AI는 제안만 만들고, 사용자가 누르기 전에는 데이터를 바꾸지 않는다. 적용한 것은
되돌릴 수 있어야 한다. 비동기와 SSE는 기존 요약 생성 패턴을 따른다.

대화
- POST, GET /ai/conversations / DELETE /ai/conversations/{id}
- GET /ai/conversations/{id}/messages
- POST /ai/conversations/{id}/messages → 202
- GET /ai/conversations/{id}/stream (SSE): step(진행 문장), delta(답변), proposal, done, error

제안
- proposal: { id, kind: add|move|update|retro_draft, summary, items: [{ todoId?, title, before, after, clash? }], status: pending|applied|dismissed }
- POST /ai/proposals/{id}/apply, /undo, /dismiss. apply는 A와 같은 트랜잭션 보장

추천
- GET /ai/suggestions?date=YYYY-MM-DD
- 응답: [{ id, kind: overdue|free_slot|commit_match, todoId, title, reason, actions: [{ label, patch, before, after }] }]
  화면에서 "마감 지남", "오후 5시~6시", 이유 문장, 버튼 최대 2개로 쓴다
- POST /ai/suggestions/{id}/apply { actionIndex }, /dismiss, /undo
- 숨긴 추천은 다시 나오지 않아야 한다

AI 설정
- GET, PUT /ai/settings: petEnabled, tools{calendar, todo, retro, github}, confirmMode, deepSearch, answerLength, memory, retentionDays
- GET, POST /ai/schedules / PATCH, DELETE /ai/schedules/{id}: 예약한 일 (Celery beat 사용)
- GET /ai/usage: 기존 /summaries/usage와 같은 형태의 사용량 제한

확인 요청: 현재 Gemini 클라이언트를 도구 호출과 스트리밍에 재사용할 수 있는지, 비용 상한을
어떻게 둘지 계획에 포함해줘.

## G. 계정과 데이터 (P4)

- DELETE /auth/me: 계정 삭제
- 프로필 사진 업로드 (UpdateProfileRequest에 지금 없음)
- POST /exports → 202, 완료되면 알림과 다운로드 링크. 범위: 회고, 할 일, AI 대화
- 휴지통: todos, journal_entries에 deleted_at. 30일 뒤 삭제. GET /trash, 복원 API
- 주간 요약 이메일 수신 설정
```

## FE에서 먼저 확인할 것

- 개발자, 일반 계정 구분을 없앤다. FE는 GitHub 연결 여부로 기능을 나누므로 `accountType`을 더는 보내거나 읽지 않는다. BE의 필드는 호환을 위해 당분간 두고, 제거 시점을 함께 정한다.
- FE `api.yaml`에는 BE의 `/v2/auth/*`, `/v2/settings/auto-summary/active` 5개 경로가 없다. 작업 시작 전에 동기화가 필요하다.
