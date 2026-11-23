# 12. data (새 모듈): 휴지통, 내보내기

단계: 6단계.

## 화면

설정 "데이터와 보안" 시트: 로그인한 기기(기존 세션 API), 내보내기(N1), 휴지통(N3).

## §1. 휴지통

할 일(`02-todo.md` §4)과 회고(`05-retrospective.md` §3)의 `deleted_at`을 모아 보여 주고 되살린다.
각 모듈이 자기 테이블을 다루고, `data` 모듈은 목록과 라우팅만 한다.

### API

| 메서드 | 경로 | 내용 |
|---|---|---|
| GET | `/trash?kind=todo\|entry&page=&size=` | 지운 것, 지운 시각 내림차순. `{ kind, id, title, dateKey, deletedAt, purgeAt }` |
| POST | `/trash/{kind}/{id}/restore` | 되살리기. 할 일은 반복 시리즈면 지운 범위를 함께 |
| DELETE | `/trash/{kind}/{id}` | 바로 영구 삭제 |
| DELETE | `/trash` | 휴지통 비우기 |

- `purgeAt = deletedAt + 30일`.
- 영구 삭제 작업 `worker.purge_trash`(하루 한 번): 30일 지난 행을 지운다. 회고는 `entry_chunks`도, 할 일은 `todo_embeddings`도 지운다.
- 폴더는 휴지통에 넣지 않는다. 폴더를 지우면 안의 회고만 휴지통으로 간다(05 §3).

### 오류 코드

`TRASH_ITEM_NOT_FOUND`(404), `TRASH_KIND_INVALID`(422)

## §2. 내보내기

### API

- `POST /exports { scopes: ["retro", "todo", "ai"], format: "md" | "json" }` → 202 `{ id }`
- `GET /exports/{id}` → `{ status: pending|ready|failed, downloadUrl?, expiresAt? }`
- 완료되면 알림(`category: system`, 링크 `{ kind: "export", id }`).

### 만드는 내용

| 범위 | Markdown | JSON |
|---|---|---|
| 회고 | 폴더 구조대로 회고 한 편당 파일 하나, 머리에 날짜와 종류 | 회고 배열 |
| 할 일 | 월별 파일 하나, 날짜와 상태 목록 | 할 일 배열(반복 규칙 포함) |
| AI | 대화별 파일 | 대화와 메시지 배열 |

- 작업 `worker.build_export`가 zip을 만들어 저장하고 서명 URL(24시간)을 준다. 7일 뒤 파일을 지운다.
- 사용자당 동시에 하나, 하루 3번.

### 저장소

`exports(id, user_id, scopes, format, status, file_key, created_at, ready_at, expires_at)`

### 오류 코드

`EXPORT_IN_PROGRESS`(409), `EXPORT_DAILY_LIMIT`(429), `EXPORT_NOT_FOUND`(404), `EXPORT_EXPIRED`(410)

## 테스트

- 되살린 할 일과 회고가 모든 조회에 다시 나옴
- 30일 경계 영구 삭제, 임베딩과 청크까지 지워짐
- 내보내기: 지운 것 제외, 큰 데이터(회고 1,000편)에서 메모리, 만료 후 410
