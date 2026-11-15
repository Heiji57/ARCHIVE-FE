# 03. settings: 설정 확장

단계: 3단계.

## 지금

`UserSettings`(`settings/domain/models/user_settings.py`): `locale`, 자동 요약 3종, `notification_retention_days`,
Google Calendar 자동 보내기와 자동 삭제, GitHub push 대상 저장소, 활성 요약과 회고 템플릿.
`GET /settings`, `PUT /settings`, 국가와 시간대 PATCH.

주의 시작은 월요일로 고정돼 있다(`shared/domain/utils/period.py` `monday_of_week`, `weeks_owned_by_month`).

## 바꿀 것

설정 시트(시안 `d-settings.html`)의 항목 가운데 서버가 알아야 하는 것을 더한다.
서버가 읽는 값은 컬럼, 화면에서만 쓰는 값은 JSONB 한 덩어리로 둔다.

### 서버가 읽는 값 (컬럼)

| 필드 (API) | 컬럼 | 타입 | 기본값 | 화면 | 서버에서 쓰는 곳 |
|---|---|---|---|---|---|
| `weekStart` | `week_start` | `mon` \| `sun` | `mon` | I4 주 시작 요일 | 주간 회고와 요약 기간, "이번 주", AI |
| `workSchedule` | `work_schedule` JSONB | 아래 | 월~금 09:00~18:00 | J2 일하는 시간 | AI 빈 시간 추천과 일정 배치, 마감 알림 시각 |
| `defaultTodoMinutes` | `default_todo_minutes` | int 15~480 | 60 | J1 기본 할 일 길이 | AI 배치, 묶음 이월 시 길이 없는 할 일 |
| `dayEndReminder` | `day_end_reminder` JSONB | `{ enabled, at: "HH:mm" }` | `{ false, "21:30" }` | K1 하루 마무리 알림 | 알림 예약 (04 §4) |
| `notificationPrefs` | `notification_prefs` JSONB | `{ due, summary, schedule, sync, ai: bool }` | 모두 true | M1 알림 종류 | 알림 생성 시 거르기 (04 §2) |
| `quietHours` | `quiet_hours` JSONB | `{ enabled, from: "HH:mm", to: "HH:mm" }` | `{ false, "23:00", "08:00" }` | M3 방해 금지 | 알림 보류 (04 §3) |
| `emailDigest` | `email_digest` | `off` \| `weekly` | `off` | M4 이메일 요약 | 주간 이메일 (04 §5) |

`workSchedule` 형식:

```json
{ "days": [1, 2, 3, 4, 5],
  "perDay": { "1": { "from": "09:00", "to": "18:00" }, "5": { "from": "09:00", "to": "15:00" } } }
```

- `days`는 0(일)~6(토). `perDay`에 없는 요일은 첫 번째 일하는 날의 시간을 쓴다.
- 검증: `HH:mm`, `from < to`, 하루 안(자정을 넘는 근무는 1차 범위 밖).

### 화면에서만 쓰는 값 (JSONB)

`ui_preferences JSONB NOT NULL DEFAULT '{}'`, API 이름 `uiPreferences`. 서버는 검증만 하고 해석하지 않는다.

| 키 | 화면 | 값 |
|---|---|---|
| `startTab` | I3 처음 열 화면 | `ai` \| `calendar` \| `todos` \| `retro` |
| `timeFormat` | I5 시간 표시 | `24h` \| `12h` |
| `doneDisplay` | J3 완료한 일 보이기 | `show` \| `dim` \| `hide` |
| `defaultRetroFolderId` | K2 새 회고 기본 폴더 | 폴더 id 또는 null |
| `spellcheck` | D4 맞춤법 밑줄 | bool |
| `browserNotifications` | M2 브라우저 알림 | bool (권한은 브라우저가 관리) |

- 크기 상한 8KB. 알 수 없는 키는 받아서 그대로 저장한다(FE가 키를 늘려도 서버 배포가 필요 없게).
- `defaultRetroFolderId`가 지워진 폴더를 가리키면 GET 응답에서 null로 내려 준다.

### AI 설정

AI 비서 시트(L0~L6)는 `11-ai.md` §5의 `/ai/settings`로 따로 둔다. 설정 응답을 무겁게 하지 않고,
AI를 1차 출시에서 빼도 이 문서와 무관하게 하기 위해서다.

## API

- `GET /settings`, `PUT /settings`에 위 필드를 더한다. 응답에 더하는 것이라 v1 그대로.
- `PUT`이 전체 교체라면 FE가 모르는 새 필드를 지우지 않도록, 빠진 필드는 기존 값을 유지하는지 확인한다.
  지금 동작이 전체 교체라면 `PATCH /settings`(부분 수정)를 새로 두는 편을 권한다.

## 주 시작 요일을 바꿀 때 (중요)

`monday_of_week` 등을 쓰는 곳이 많다: 주간 회고 기간 키, 주간 요약 생성(`dispatch_summaries_for_tz`), 월에 속한 주 계산,
GitHub push의 `period_key`(`YYYY-MM-WN`), 할 일 통계 `range=week`.

- 함수에 `week_start` 인자를 받게 하고, 사용자 설정을 읽어 넘긴다.
- **이미 만든 주간 회고와 요약은 다시 계산하지 않는다(결정, 2026-11-16).** 기간 키와 기간을 그대로 두고,
  설정을 바꾼 날 이후 시작하는 주부터 새 경계를 쓴다. 바꾼 주에 기간이 겹치거나 비는 경우는 그 주만 8일 또는 6일로 둔다.
- 이미 push한 GitHub `period_key`도 다시 만들지 않는다.
- 이 변경은 `05-retrospective.md` §2와 함께 한다.

## 마이그레이션

`user_settings`에 컬럼 8개 추가, 모두 기본값 있음. 기존 행은 기본값으로 채운다.

## 오류 코드

`SETTINGS_INVALID_TIME`(422), `SETTINGS_INVALID_WORK_SCHEDULE`(422), `SETTINGS_UI_PREFS_TOO_LARGE`(413)

## 테스트

- 기본값으로 생성된 기존 사용자
- 일하는 시간 검증(시간 역전, 범위 밖 요일)
- `uiPreferences` 알 수 없는 키 보존, 8KB 초과 거절
- 주 시작을 일요일로 바꾼 뒤의 주간 요약 기간(바꾼 주와 다음 주)
