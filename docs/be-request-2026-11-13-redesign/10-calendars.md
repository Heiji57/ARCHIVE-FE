# 10. calendars (새 모듈): 사용자 캘린더

단계: 4단계. 시안에 있는 기능이라 1차에 만든다(결정, 2026-11-16). `02-todo.md` §5, `08-google-calendar.md` §2와 함께 한다.

## 화면

캘린더 사이드바의 캘린더 목록(개인, 팀, 스터디)과 색, 끄고 켜기. 설정 "캘린더와 태그 관리"(J4).
할 일 모달과 새 할 일 창의 캘린더 고르기.

## 모듈 구조

새 모듈 `calendars/`(Clean Architecture 레이어). Provider를 `main.py` 컨테이너에, 라우터를 `create_app()`에 등록.
Google 연동 모듈 `google_calendar`와 이름이 겹치지 않게 엔드포인트는 `/calendars`, 연동은 지금처럼 `/calendar/*`.

## 저장소

`calendars(id, user_id, name, color, sort_order, is_default, push_to_google, created_at, updated_at)`

- `UNIQUE(user_id, name)`, 사용자마다 `is_default = true`가 정확히 하나(부분 유니크 인덱스).
- `color`는 FE 팔레트 키(`c1`~`c8`).
- 마이그레이션에서 모든 사용자에게 기본 캘린더 "내 캘린더"를 만든다(`locale`별 이름은 FE가 보여 줄 때 바꾸지 않고, 서버는 고정 키 `default`를 이름 대신 쓰는 방안도 계획에서 검토).

## API

| 메서드 | 경로 | 내용 |
|---|---|---|
| GET | `/calendars` | 목록, `sort_order` 순 |
| POST | `/calendars` | `{ name, color }`. 최대 20개 |
| PATCH | `/calendars/{id}` | `{ name?, color?, sortOrder?, pushToGoogle? }` |
| DELETE | `/calendars/{id}` | 기본 캘린더는 `CALENDAR_DEFAULT_UNDELETABLE`(409). 그 캘린더의 할 일은 기본 캘린더로 옮긴다 |

캘린더를 화면에서 "끄는" 것은 보기 설정이라 서버에 두지 않는다(FE 로컬 저장). 할 일 조회의 `calendarIds` 거르기는 `02-todo.md` §5.

## 오류 코드

`CALENDAR_NOT_FOUND`(404), `CALENDAR_DEFAULT_UNDELETABLE`(409), `CALENDAR_LIMIT_EXCEEDED`(422), `CALENDAR_NAME_DUPLICATE`(409)

## 테스트

- 가입 시 기본 캘린더 생성(가입과 OAuth 온보딩 둘 다)
- 기본 캘린더 삭제 거절, 다른 캘린더 삭제 시 할 일 이동
- 다른 사용자의 캘린더 id로 할 일을 만들 수 없음
