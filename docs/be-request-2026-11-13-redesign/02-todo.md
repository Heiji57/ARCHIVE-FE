# 02. todo: 묶음 수정, 조회 보강, 태그, 휴지통, 캘린더

단계: §1·§2는 1단계, §3은 4단계, §4는 6단계, §5는 4단계(사용자 캘린더를 만들기로 한 경우).

## 지금

- `GET /todos`는 `dateKey` 하나 또는 `from`~`to` 범위로만 조회한다.
- `PATCH /todos/{id}`는 반복 할 일의 `recurrence_scope`를 받는다. 한 번에 하나씩이다.
- 태그는 `todos.tags` 문자열 배열이다. `GET /todos/tags/search`로 이름 검색만 된다.
- `DELETE /todos/{id}`는 바로 지운다.
- 상태는 `not-start / in-progress / done / cancelled`.

## §1. 묶음 수정 (1단계)

쓰는 화면: 하루 닫기와 내일로 이월(22번), "모두 하기", 한 번에 되돌리기, AI 제안 적용(11 §4).

### API

`POST /todos/batch`

```json
{ "operations": [ { "id": "t1", "patch": { "dateKey": "2026-11-04", "status": "not-start" } },
                  { "id": "t2", "patch": { "status": "done" }, "recurrenceScope": "this" } ] }
```

- `patch`는 `PATCH /todos/{id}`의 요청 본문과 같은 규칙이다. 반복 할 일은 `recurrenceScope`를 함께 받는다.
- **전부 아니면 전무:** 한 트랜잭션에서 처리한다. 하나라도 실패하면 모두 되돌리고,
  `details.failures: [{ id, code }]`에 실패 이유를 담아 400(또는 첫 실패의 상태 코드)으로 응답한다.
- 응답 200: `{ "todos": TodoResponse[], "previous": TodoResponse[] }`. `previous`는 변경 전 값으로,
  FE의 "되돌리기"가 그대로 다시 `POST /todos/batch`에 넣는다.
- 한 번에 최대 100개. 같은 id가 두 번 나오면 422.
- Google Calendar 보내기는 커밋 후 건별로 기존 `push_calendars` 흐름에 넣는다(트랜잭션 밖).
- 임베딩 갱신 표시(`embed_stale` 대상)도 건별 수정과 같게 남긴다.

### 구현 메모

- 기존 `UpdateTodoUseCase`의 검증 로직을 함수로 빼서 단건과 묶음이 같이 쓴다.
- 반복 할 일의 `this / following / all` 처리가 다른 행을 만들거나 지우므로, 묶음 안에서 같은 시리즈를
  두 번 건드리면 순서대로 적용하고 결과를 다시 읽어 응답한다.

## §2. 지난 마감과 보내기 실패 조회 (1단계)

FE는 보이는 기간만 불러오므로, 오래전에 마감이 지난 일과 Google 보내기 실패를 놓친다.
쓰는 화면: 오른쪽 패널 "마감" 탭(일주일 띠), 캘린더 사이드바 "연동 문제", AI 추천(마감 지남).

`GET /todos`에 선택 파라미터를 더한다. 기존 `dateKey`, `from`, `to`와 함께 쓰지 않는다(함께 오면 422).

| 파라미터 | 뜻 |
|---|---|
| `overdue=true` | 끝내지 않았고(`done`, `cancelled` 아님) 마감(`due_date_key`, 없으면 `date_key`)이 사용자 시간대의 오늘보다 이전 |
| `due=from..to` | 마감이 그 기간에 있는 일. 마감 탭의 일주일 띠 |
| `calendarPushStatus=failed` | Google 보내기 실패 |
| `page`, `size` | 기존 페이지 규칙. 기본 50 |

- 정렬: 마감 오래된 순.
- 반복 할 일은 펼쳐진 인스턴스 기준이다(지금 범위 조회와 같은 펼치기 로직을 쓴다).

## §3. 태그 관리 (4단계)

설정 "캘린더와 태그 관리"(J4), 사이드바 태그 목록, 태그 색.
지금 FE는 태그 이름 해시로 색을 정한다(`tagColor.ts`).

### 저장소

`user_tags(id, user_id, name, color, sort_order, created_at)`, `UNIQUE(user_id, name)`.
`todos.tags` 배열은 그대로 두고, `user_tags`는 색과 순서만 들고 있는 보조 테이블이다.
행이 없는 태그는 FE가 지금처럼 해시 색을 쓴다.

### API

| 메서드 | 경로 | 내용 |
|---|---|---|
| GET | `/todos/tags` | 사용 중인 태그 전체: `[{ name, color, sortOrder, count }]`. `count`는 지우지 않은 할 일 수 |
| PATCH | `/todos/tags/{name}` | `{ name?, color?, sortOrder? }`. 이름을 바꾸면 그 사용자의 `todos.tags`를 한 트랜잭션에서 일괄 변경. 이미 있는 이름으로 바꾸면 합친다 |
| DELETE | `/todos/tags/{name}` | 모든 할 일에서 그 태그를 뺀다 |
| PUT | `/todos/tags/order` | `{ names: string[] }` 순서 저장 |

- `color`는 hex가 아니라 FE 팔레트 키(`c1`~`c8`)로 받는다. 다크 테마 대비를 FE가 관리하기 위해서다.
- 이름 변경과 삭제는 해당 할 일의 임베딩을 다시 만들 대상으로 표시한다(`topic` 매칭에 태그가 들어가므로).

## §4. 휴지통 (6단계)

지운 할 일은 30일 동안 되살릴 수 있다(설정 "휴지통" N3).

- `todos.deleted_at TIMESTAMPTZ NULL` + `(user_id, deleted_at)` 인덱스.
- `DELETE /todos/{id}`는 `deleted_at`을 채운다. 반복 시리즈 범위 규칙은 지금과 같다.
- **모든 조회에서 `deleted_at IS NULL`을 건다**(목록, 범위, 통계, 태그, 검색, 주제 근거, 임베딩, AI 도구).
  저장소 구현체의 공통 쿼리 함수에 넣어 빠뜨리지 않게 한다.
- Google Calendar에 보낸 일정은 지울 때 지금처럼 삭제를 보낸다. 되살리면 다시 보낸다.
- 목록, 복원, 영구 삭제 API와 30일 정리 작업은 `12-data.md`.

## §5. 사용자 캘린더 연결 (4단계)

`10-calendars.md`와 함께:

- `todos.calendar_id UUID NULL` (null이면 기본 캘린더)
- 생성, 수정 요청과 응답에 `calendarId`
- 조회에 `calendarIds=a,b` 거르기 파라미터(사이드바에서 캘린더 끄기)
- 캘린더를 지우면 그 할 일은 기본 캘린더로 옮긴다

## 오류 코드 (새로)

`TODO_BATCH_TOO_LARGE`(422), `TODO_BATCH_DUPLICATE_ID`(422), `TODO_BATCH_FAILED`(400, details에 건별 코드),
`TAG_NOT_FOUND`(404), `TODO_QUERY_CONFLICT`(422, 조회 파라미터를 섞음)

## 테스트

- 묶음: 100개 성공, 101개 거절, 중간 하나 실패 시 전체 롤백과 `previous` 일치, 반복 할 일 `this`와 `following` 섞기
- 지난 마감: 시간대 경계(사용자 시간대 자정 직전과 직후), 반복 인스턴스, 끝낸 일 제외
- 태그: 이름 변경 합치기, 삭제 후 `count`, 다른 사용자 태그 영향 없음
- 휴지통: 지운 할 일이 모든 조회에서 빠지는지(회귀 테스트로 조회 엔드포인트 전부)
