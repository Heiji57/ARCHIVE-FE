# 13. worker: 작업과 beat 일정 모음

각 도메인 문서에서 생기는 Celery 작업을 한곳에 모았다. 구현은 해당 도메인 단계에서 한다.

## 지금

`worker/celery_app.py` beat: `dispatch-summaries-hourly`(매시간), `sync-calendars-periodic`, `embed-stale-periodic`(5분).
작업: `generate_summary`, `dispatch_summaries_for_tz`, `sync_calendars`, `push_calendars`, `embed_stale`, `generate_digest`.

## 바뀌는 작업

| 작업 | 바꿀 것 | 문서 | 단계 |
|---|---|---|---|
| `generate_digest` | 근거 표식, JSON 출력과 검증, `structured` 저장, markdown 만들기, `_PROMPT_VERSION = "4"` | 06 §1 | 2 |
| `dispatch_summaries_for_tz` | 주간 기간을 사용자 `week_start`로 | 05 §2 | 3 |
| `sync_calendars` | 취소된 일정의 할 일을 휴지통으로, 알림 하나로 묶기 | 08 §1 | 6 |
| `embed_stale` | 지운 할 일과 회고 건너뛰기 | 02 §4, 05 §3 | 6 |

## 새 작업

| 작업 | 실행 | 하는 일 | 문서 | 단계 |
|---|---|---|---|---|
| `dispatch_due_reminders` | beat 5분 | 일하는 날 첫 근무 시각이 된 사용자에게 마감 알림 | 04 §4 | 3 |
| `dispatch_day_end_reminders` | beat 5분 | 하루 마무리 시각이 된 사용자에게 알림 | 04 §4 | 3 |
| `flush_quiet_notifications` | beat 5분 | 방해 금지가 끝난 알림을 SSE로 | 04 §3 | 3 |
| `send_weekly_email` | beat 매시간 | 주 시작일 09:00인 사용자에게 주간 이메일 | 04 §5 | 3 |
| `run_ai_turn` | 요청 시 | 대화 한 번(도구 호출, 제안 만들기, SSE) | 11 §3 | 5b |
| `dispatch_ai_schedules` | beat 5분 | 시각이 된 AI 예약 실행 | 11 §5 | 5c |
| `purge_ai_conversations` | beat 하루 | 보관 기간이 지난 대화와 제안 삭제 | 11 §5 | 5c |
| `purge_trash` | beat 하루 | 30일 지난 휴지통 영구 삭제 | 12 §1 | 6 |
| `build_export` | 요청 시 | 내보내기 zip 만들기, 7일 뒤 파일 삭제 | 12 §2 | 6 |
| `revoke_account_tokens` | 요청 시 | 지운 계정의 GitHub, Google 토큰 철회 | 01 §3 | 6 |
| `purge_deleted_accounts` | beat 하루 | soft delete 후 30일 지난 계정과 데이터 완전 삭제 | 01 §3 | 6 |

## 공통 규칙

- **지운 계정 제외:** 사용자를 고르는 모든 beat 작업은 `users.deleted_at IS NULL`인 사용자만 본다(01 §3).

- **5분 창 작업의 중복 방지:** 대상 사용자를 고를 때 "이번 5분 창에 시각이 들어옴" + "오늘 아직 안 보냄"(날짜 컬럼)을 함께 본다.
  작업이 늦게 돌거나 두 번 돌아도 한 번만 보낸다.
- **시간대 묶음 조회:** `dispatch_summaries_for_tz`처럼 시간대별로 묶어 그 시간대의 지금 시각을 한 번만 계산한다.
- **재시도:** 외부 호출(Gemini, GitHub, SMTP) 실패는 기존 `self.retry()` 방식(async 작업에 `autoretry_for`가 듣지 않는 문제, `generate_digest` 주석 참고).
- **예외 경계:** 작업 최상위와 사용자별 반복 안에서만 `except Exception`(한 사용자의 실패가 다른 사용자를 막지 않게).
- **로그:** 사용자 귀속은 `structlog.contextvars.bind_contextvars(user_id=...)`(지금 `generate_digest`와 같게).
