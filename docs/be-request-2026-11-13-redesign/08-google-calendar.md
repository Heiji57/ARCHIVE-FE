# 08. google_calendar: 지운 일정의 할 일, 사용자 캘린더

단계: §1은 6단계(휴지통 뒤), §2는 4단계(사용자 캘린더를 만들기로 한 경우).

## 지금

- 할 일을 Google Calendar로 보내고(`push_calendars`), 주기적으로 받아온다(`sync_calendars`).
- 받아올 때 취소된(cancelled) 일정에 연결된 할 일은, `calendar_auto_delete_todo`가 켜져 있으면 **바로 지운다**
  (`sync_calendar_events.py`).
- 보내기 실패는 `todos.calendar_push_status = failed`로 남고, 재시도는 `POST /todos/{id}/calendar-link`.

## §1. 지운 일정의 할 일은 휴지통으로 (6단계)

설정 "캘린더에서 지우면 할 일도"(G3)를 켤 때 시안이 "지운 할 일은 휴지통에 30일 남아요"라고 안내한다.

- 자동 삭제를 `deleted_at`을 채우는 것으로 바꾼다(`02-todo.md` §4).
- 휴지통에서 되살리면: Google의 원래 일정은 이미 지워졌으므로 `google_event_id`를 비우고,
  `calendar_auto_push_todo`가 켜져 있으면 새 일정으로 다시 보낸다.
- 지운 할 일마다 알림을 만들지 않고, 동기화 한 번에 "Google에서 지운 일정 n개를 휴지통으로 옮겼어요" 하나를 만든다
  (`category: sync`).

## §2. 사용자 캘린더와 보내기 (4단계)

`10-calendars.md`와 함께:

- 캘린더마다 Google로 보낼지 정하는 `push_to_google`(기본: 기본 캘린더만 true).
- 보내기 대상 판단을 `calendar_auto_push_todo and calendar.push_to_google`로 바꾼다.
- Google 쪽 대상 캘린더는 지금처럼 기본(primary) 하나로 둔다. 캘린더별로 다른 Google 캘린더에 보내는 것은 범위 밖.

## 바꾸지 않는 것

- 보내기 실패 목록은 `02-todo.md` §2의 `GET /todos?calendarPushStatus=failed`로 조회한다. 이 모듈에 새 API는 없다.
- `GET /calendar/events`, `GET /calendar/connection`은 그대로.

## 테스트

- 자동 삭제가 휴지통으로 가는지, 되살린 뒤 다시 보내지는지
- 여러 개를 지워도 알림이 하나인지
