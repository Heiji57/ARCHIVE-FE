# 04. notification: 종류, 수신 거르기, 방해 금지, 예약 알림

단계: 3단계(§5 이메일 포함).

## 지금

- `Notification(type: info|success|warning|error, category: sync|summary|system, title, message, is_read)`
- `GET /notifications/stream`(SSE), 목록, 읽음, 삭제. 보관 기간은 `notification_retention_days`.
- 알림을 만드는 곳: 요약 생성 완료, 캘린더 동기화 실패 등.

## 바꿀 것

화면: 오른쪽 아이콘 줄의 벨과 알림 패널(종류별 거르기), 설정 알림 시트(M1~M4).

### §1. 종류 추가

`NotificationCategory`에 더한다.

| 값 | 뜻 | 만드는 곳 |
|---|---|---|
| `due` | 마감 알림(오늘 마감, 지난 마감) | §4 작업 |
| `schedule` | 하루 마무리 알림, AI 예약한 일의 결과 | §4 작업, 11 §5 |
| `ai` | AI 작업 완료, 제안 도착 | 11 §3 |

응답 enum이 넓어지는 변경이다. FE는 모르는 값을 `system`처럼 보여 주도록 이미 처리하므로 v1에 더한다.
`api.yaml`의 enum과 설명을 갱신한다.

알림에 이동할 곳을 담는 `link`(선택, 예: `{ "kind": "todo", "id": "..." }`, `{ "kind": "topic", "id": "..." }`)를 더한다.
알림 패널에서 누르면 그 화면으로 간다.

### §2. 종류별 수신 거르기

`notification_prefs`(03)에서 꺼진 종류는 **만들지 않는다**. 알림 생성을 한 곳(`CreateNotificationUseCase` 또는 서비스)으로 모으고
거기서 설정을 확인한다. `system`은 끌 수 없다.

### §3. 방해 금지

`quiet_hours`가 켜져 있고 지금이 그 시간 안이면:

- 알림은 저장하되 `deliver_after`(그 시간이 끝나는 시각, UTC)를 채운다.
- SSE와 목록은 `deliver_after IS NULL OR deliver_after <= now()`인 것만 보낸다.
- 작업 `worker.flush_quiet_notifications`(5분마다)가 시각이 지난 알림을 SSE로 밀어 준다.
- 같은 종류가 여러 개 쌓였으면 하나로 묶는 것은 2차 범위(예: "마감 알림 3개").

### §4. 예약 알림

| 알림 | 시각 | 내용 | 작업 |
|---|---|---|---|
| 마감 알림 | 사용자 시간대의 일하는 날 첫 근무 시각(없으면 09:00) | "오늘 마감 n개, 지난 마감 n개" 한 개. 둘 다 0이면 보내지 않음 | `worker.dispatch_due_reminders` |
| 하루 마무리 | `day_end_reminder.at` | "오늘을 마무리할까요? 남은 일 n개" | `worker.dispatch_day_end_reminders` |

- 두 작업 모두 5분마다 돌며, 그 5분 창에 시각이 들어오는 사용자만 고른다.
  기존 `dispatch_summaries_for_tz`처럼 시간대별로 묶어 조회한다.
- 같은 날 두 번 보내지 않도록 `user_settings.last_due_reminder_date`, `last_day_end_reminder_date`를 둔다
  (지금 `last_summary_date_local`과 같은 방식).
- 마무리 알림의 `link`는 `{ "kind": "day_close" }`. FE는 하루 닫기 흐름(22번)을 연다.

### §5. 주간 이메일 요약

`email_digest = weekly`인 사용자에게 주가 시작하는 날 오전에 지난주 요약을 보낸다.

- 내용: 끝낸 일 수, 회고 수, 마감 지난 일, 주간 요약이 있으면 그 첫 문단. 링크는 앱으로.
- 보내기: 기존 `shared/infrastructure/email/smtp.py`를 쓴다. 템플릿은 언어(`locale`)별.
- 작업 `worker.send_weekly_email`(매시간, 시간대별로 그 주 시작일 09:00인 사용자).
- 수신 거부 링크는 서명 토큰으로 `email_digest = off`로 바꾼다.

## 마이그레이션

- `notifications.deliver_after TIMESTAMPTZ NULL`, `notifications.link JSONB NULL`
- 카테고리가 문자열 컬럼이면 마이그레이션 불필요, DB enum이면 값 추가
- `user_settings.last_due_reminder_date DATE NULL`, `last_day_end_reminder_date DATE NULL`

## 테스트

- 꺼진 종류는 만들어지지 않음, `system`은 항상 만들어짐
- 방해 금지 시간이 자정을 넘는 경우(23:00~08:00)
- 마감 알림 시각 계산: 일하는 날이 아닌 날은 보내지 않음, 사용자 시간대 경계
- 같은 날 중복 발송 없음(작업이 두 번 돌아도)
