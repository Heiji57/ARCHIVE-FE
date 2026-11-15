# 05. retrospective: 커밋 자료 조건, 주 시작 요일, 휴지통

단계: §1은 0단계, §2는 3단계, §3은 6단계.

## 지금

- 회고(`JournalEntry`: `date_key`, `title`, `content`, `retro_type` daily|weekly|monthly|yearly, `folder_id`),
  폴더, 회고 템플릿, 요약(주간, 월간, 연간, SSE), GitHub push 기록.
- 회고 목록 API가 GitHub push 정보를 붙이는 조건이 `is_developer() and _is_github_connected(...)`
  (`router.py` 98, 152, 219행 근처, `folder_router.py` 139행 근처).
- 주의 경계는 월요일 고정.

화면 자체(카드 목록, 좌우로 넘기기, 편집기, 새 회고 창)는 지금 API로 만들 수 있다.
아래는 바뀌어야 하는 것만이다.

## §1. 커밋 자료와 push 정보 조건 (0단계)

`01-auth-user.md` §1과 함께 한다. 조건을 `_is_github_connected(...)`만으로 바꾼다.
회고 화면의 "그날 커밋"과 GitHub push 표시가 일반 계정에서도 보이게 된다.

## §2. 주 시작 요일 반영 (3단계)

`03-settings.md`의 `week_start`를 회고 쪽 기간 계산에 넘긴다.

| 쓰는 곳 | 바꿀 것 |
|---|---|
| 주간 회고 생성과 조회의 기간 | 주 시작 요일 기준 |
| 주간 요약 자동 생성(`dispatch_summaries_for_tz`) | 사용자 주 시작 요일의 다음 날 새벽에 지난주 요약 |
| 월에 속한 주(`weeks_owned_by_month`, `week_of_month`) | 주 시작 요일 기준으로 계산 |
| GitHub push `period_key` (`YYYY-MM-WN`) | 같은 함수 사용. 이미 push한 키는 그대로 |

- 이미 있는 주간 회고와 요약은 다시 계산하지 않는다(03 "주 시작 요일을 바꿀 때").
- 회고 카드의 "그 주에 쓴 날" 격자는 FE가 그리므로 서버 변경이 없다.

## §3. 휴지통 (6단계)

- `journal_entries.deleted_at TIMESTAMPTZ NULL`, 인덱스 `(user_id, deleted_at)`.
- `DELETE /entries/{id}`는 `deleted_at`을 채운다.
- **조회 전체에서 제외:** 목록, 페이지 목록, 폴더 내용, 검색, 요약 입력, 요약 준비 상태(readiness), 주제 근거와 통계.
- **주제 쪽 처리:** 지운 회고의 `entry_chunks`는 매칭에서 빠져야 한다. 행을 지우지 말고 매칭 쿼리에
  `entry.deleted_at IS NULL`을 건다(되살릴 때 다시 임베딩하지 않으려고). 주제 정리 본문에 이미 들어간 회고는
  다음 정리 때 빠진다(`06-topic.md`의 `source_entry_ids` 변화 감지로 전체 재생성).
- 폴더를 지우면 안의 회고도 휴지통으로 간다. 되살릴 때 폴더가 없으면 "미분류"로 돌아온다.
- 목록, 복원, 영구 삭제는 `12-data.md`.

## §4. AI 회고 초안 (5b단계)

AI 탭의 "회고 초안"과 하루 닫기의 회고 초안은 `11-ai.md`의 제안(`kind: retro_draft`)으로 만든다.
적용하면 기존 회고 생성 유스케이스를 그대로 부른다. 이 모듈에 새 API는 없다.

## 테스트

- 일반 계정 + GitHub 연결: 목록에 push 정보
- 주 시작 일요일: 주간 회고 기간, 월에 속한 주, push 키
- 휴지통: 지운 회고가 목록, 검색, 요약, 주제 근거에서 빠짐. 되살리면 다시 나옴
