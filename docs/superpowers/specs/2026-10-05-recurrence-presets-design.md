# 반복 규칙 확장 (매월 n번째 요일 · 매년 · 맞춤) + 현재 규칙 노출

- 날짜: 2026-10-05
- 범위: ARCHIVE-FE (`fix-repeat-rule-confirm`) + ARCHIVE-BE (`feat/recurrence-monthly-yearly`, base `origin/develop`)
- 디자인 시안: https://claude.ai/artifact/N9mXse4ongokufof6s8dvd (상세 패널 드롭다운 + 맞춤 모달, QuickCapture 칩)

## 목표

1. 반복 선택을 Google Calendar 식 **프리셋 드롭다운**으로 바꾼다 — 기준일(할 일 날짜)에서 계산:
   `반복 안함`(신규 생성만) · `매일` · `매주 {요일}` · `매월 {n번째|마지막} {요일}` · `매년 {M월 D일}` · `주중 매일(월-금)` · `맞춤…`
2. **맞춤…** 은 별도 모달: `[숫자] [일|주|개월|년] 마다`, 주 단위면 반복 요일(복수) 토글, 종료(없음/날짜), 미리보기, 취소/완료.
3. 상세 패널에서 **현재 규칙이 보이도록** 한다 (가상 인스턴스에 시리즈 규칙 노출).
4. 기존 `day`/`week` 규칙 데이터는 그대로 동작한다 (마이그레이션 불필요).

비목표: "N회 후 종료"(COUNT), "매월 7일" 같은 날짜 기반 월간 반복, 예외 row 의 규칙 변경.

## 계약 (api.yaml — BE·FE 양쪽 동일하게 수정)

```yaml
RecurrenceRule:
  required: [unit, interval]
  properties:
    unit: { enum: [day, week, month, year] }
    interval: { integer, 1..365 }
    until: { string|null, YYYY-MM-DD }
    weekdays:    # unit=week 전용. 0=월 … 6=일, 중복 없음, 1~7개. null/생략 = 시작일 요일.
      type: array, nullable, items: { integer 0..6 }
    month_week:  # unit=month 전용·필수. 1~4 = n번째, -1 = 마지막. 요일은 시작일(date_key) 요일.
      type: integer, nullable, enum: [1, 2, 3, 4, -1]
TodoResponse.series_rule:   # 신규. 가상 인스턴스(is_virtual)에만 시리즈 규칙, 그 외 null.
  $ref RecurrenceRule, nullable
```

검증(422 `VALIDATION_ERROR`): `weekdays` 는 unit=week 에서만 허용·비어있지 않음·0..6·중복 없음 / `month_week` 는 unit=month 에서 필수, 다른 unit 에선 금지.

## 슬롯 생성 의미 (RFC 5545 RRULE 과 동일하게)

- 시작일(`date_key`, DTSTART)은 **항상 첫 회차** (RFC 5545: DTSTART 는 항상 첫 occurrence).
- `day`: 기존과 동일.
- `week`: 주 경계 = 월요일(WKST=MO). 시작일이 속한 주를 0번째로 `interval` 주마다, 그 주의 `weekdays`(없으면 시작일 요일) 날짜 중 시작일 이후.
- `month`: 시작월부터 `interval` 개월마다, 그 달의 `month_week` 번째(또는 마지막) 시작일-요일. 없으면(5번째 등) 건너뜀.
- `year`: 시작일 월/일, `interval` 년마다. 2/29 시작은 윤년에만.
- `until`(포함) 적용은 기존과 동일.
- GCal RRULE: `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY;INTERVAL=n[;BYDAY=MO,WE | 1WE | -1WE][;UNTIL=YYYYMMDD]`.

## BE 변경 (ARCHIVE-BE)

| 파일 | 변경 |
|---|---|
| `todo/domain/models/todo.py` | `RecurrenceRule` 에 `weekdays: tuple[int,...] \| None`, `month_week: int \| None` 추가, unit Literal 확장. `Todo.series_rule: RecurrenceRule \| None = None` (비영속, 가상 인스턴스용) |
| `todo/domain/utils/recurrence.py` | `generate_slots_from` 을 unit 별로 재작성(범위 시작점으로 점프 후 생성 — stats `range=all` 안전장치 유지). `make_virtual` 이 `series_rule=base.recurrence_rule` 세팅. `rule_to_rrule()` 을 여기로 이동(순수 함수) |
| `todo/presentation/requests/requests.py` | `RecurrenceRuleRequest` 필드·교차 검증(model_validator) |
| `todo/presentation/responses/responses.py` | `RecurrenceRuleResponse` 필드 추가, `TodoResponse.series_rule` |
| `todo/infrastructure/persistence/repositories/todo_repo.py` | `_rule_to_dict`/`_dict_to_rule` 및 raw-row 매핑(614·646행 부근)에 신규 필드 (구 데이터는 `.get` → None) |
| `todo/application/use_cases/update_todo.py`, `delete_todo.py` | 규칙 복사 시 `dataclasses.replace(rule, until=…)` 로 신규 필드 보존 (지금은 unit/interval 만 복사해 손실됨) |
| `google_calendar/.../calendar_push_service.py` | `_recurrence_rule_to_rrule` → 공용 `rule_to_rrule` (BYDAY 포함) |
| `api.yaml`, `src/app/todo/CLAUDE.md` | 계약·정책 문서화 |
| `test/test_recurrence_slots.py` (신규) | 주(복수 요일·격주)·월(1~4, 마지막, 5번째 없는 달 skip, 격월)·년(2/29)·until·범위 점프·RRULE 문자열·요청 검증·`series_rule` 노출 |

DB 마이그레이션 없음 (`recurrence_rule` 은 JSONB).

## FE 변경 (ARCHIVE-FE/my-app)

| 파일 | 변경 |
|---|---|
| `api.yaml` → `pnpm gen:api` | BE 와 동일 계약 반영 |
| `entities/todo/model/types.ts` | `RecurrenceRule` 확장(`weekdays?`, `monthWeek?`), `Todo.seriesRule` |
| `shared/api/mappers.ts`, `shared/api/todos.ts` | rule snake↔camel 변환(`month_week`↔`monthWeek`)을 경계에서만 — 생성/수정 body 도 변환 함수 경유 |
| `entities/todo/lib/recurrence.ts` (신규) | 순수 함수: `weekdayOf(dateKey)`, `monthWeekOf(dateKey)`(n번째 + 마지막 여부), `buildRecurrencePresets(dateKey)`, `formatRecurrenceRule(rule, dateKey, t)`, `sameRecurrenceRule`, `rebaseRecurrenceRule(rule, newDateKey)` |
| `entities/todo/ui/RecurrencePopover.tsx` | 시안의 프리셋 드롭다운으로 교체 (`dateKey`, `value`, `onSelect(rule\|null)`, `onClose`, `showOffOption`). 맞춤 선택 시 모달 오픈. 현재 규칙이 프리셋에 없으면 맨 위에 그 규칙 항목(선택 표시) |
| `entities/todo/ui/RecurrenceCustomDialog.tsx` (신규) | 시안의 맞춤 모달. 취소/바깥 클릭 = 변경 없음, 완료 = 확정 (주 단위·요일 0개면 완료 비활성) |
| `entities/todo/ui/TaskDetailPanel.tsx` | 트리거 라벨 = 현재 규칙 문구(`seriesRule ?? recurrenceRule`, 비반복이면 "반복으로 전환"). 항목 선택 = 확정: 가상 인스턴스는 현재와 다를 때만 `onUpdateRecurrence`, 비반복은 `onConvertToRecurring`. 바깥 클릭은 변경 없음 (1차 수정의 draft 로직은 이 구조로 대체) |
| `widgets/todo-board/ui/QuickCapture.tsx` | 같은 드롭다운(`showOffOption`), 칩 라벨 = 규칙 문구, 날짜 변경 시 `rebaseRecurrenceRule` 로 월간 n번째 재계산 |
| `shared/lib/i18n/locales/{ko,en,ja,zh}.ts` | 프리셋·모달·요일 문구 키 |

## 검증

- BE: `pytest` 전체(기준 293 passed) + 신규 테스트, `ruff`, `mypy`(모듈), 리포 규칙대로 Sonnet 서브 에이전트 리뷰.
- FE: `pnpm build`, `pnpm lint`(변경 파일), `recurrence.ts` 순수 함수는 Node strip-types 스크립트로 계산 결과 확인(스크래치, 커밋 안 함), 실제 화면은 로컬 BE+FE 로 확인 가능하면 확인.
