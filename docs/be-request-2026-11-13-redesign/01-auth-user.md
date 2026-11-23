# 01. auth, user: 계정 구분 제거, 프로필, 계정 삭제

단계: §1은 0단계, §2와 §3은 6단계.

## §1. 개발자 계정 구분을 GitHub 연결 기준으로 (0단계)

### 지금

- `users.account_type`이 `"developer" | "user"`이고, JWT access token에 `account_type` 클레임으로 들어간다.
  (`shared/infrastructure/auth/jwt.py` `create_access_token`, `UserContext.is_developer()`)
- 이 값이 기능을 막는다.
  - `github/presentation/router.py` `_require_developer`: GitHub API 전체가 개발자 전용, 아니면 403 `DeveloperAccountRequiredException`
  - `retrospective/presentation/router.py`, `folder_router.py`: 회고 목록의 GitHub push 정보가 `is_developer() and _is_github_connected(...)`일 때만 붙는다
- 가입(`register`), OAuth 온보딩(`complete_onboarding`), 프로필 수정(`update_profile`)이 `account_type`을 받는다.

### 바꿀 것

FE는 개발자와 일반 계정 구분을 없애고 **GitHub 연결 여부**로 커밋 기능을 보여 준다(명세 3장 "계정 구분").

1. GitHub 라우터의 `_require_developer`를 지운다. 연결이 없을 때의 처리는 각 유스케이스가 이미 하는
   "연결 없음" 오류를 그대로 쓴다.
2. 회고 라우터의 조건을 `_is_github_connected(...)`만으로 바꾼다.
3. `account_type`은 **당분간 남긴다.** 요청에서 선택 값이 되고(없으면 `"user"`), 응답에는 계속 나간다.
   FE는 더 이상 보내거나 읽지 않는다. 제거 시점은 FE 배포 후 별도로 정한다.
4. JWT 클레임 `account_type`은 그대로 둔다(기존 토큰 호환). 서버 로직은 이 값을 더 읽지 않는다.

### 오류 코드

- `DeveloperAccountRequiredException`(403)은 더 이상 나오지 않는다. v1 계약에서 응답 코드가 사라지는 변경이라
  `api.yaml`의 `/github/*` `x-error-codes`에서 지우고, 예외 클래스는 v1 호환 기간 동안 남겨 둔다.

### 테스트

- 일반 계정 + GitHub 연결: `/github/commits` 200, 회고 목록에 push 정보 포함
- 일반 계정 + 연결 없음: 기존 "연결 없음" 오류
- 개발자 계정: 지금과 같음

## §2. 프로필 이름과 사진 (6단계)

### 지금

- `UpdateProfileRequest`가 `displayName`을 받지만 `User` 엔티티와 테이블에 이름 필드가 없어 **저장되지 않는다**
  (`update_profile.py`는 `account_type`만 반영). `UserResponse`에도 이름이 없다.
- 프로필 사진 업로드가 없다.

### 바꿀 것

설정 "이름과 프로필 사진"(I2), 사이드바와 사용자 메뉴의 이름과 사진.

| 항목 | 내용 |
|---|---|
| 저장소 | `users.display_name VARCHAR(50) NULL`, `users.avatar_key VARCHAR NULL` |
| `PATCH /auth/me` | `displayName` 저장(공백 제거, 1~50자, null이면 지움) |
| `POST /auth/me/avatar` | multipart, png/jpeg/webp, 2MB 이하. 서버에서 256px 정사각형으로 줄여 저장. 응답 `avatarUrl` |
| `DELETE /auth/me/avatar` | 사진 지움 |
| `UserResponse` | `displayName`, `avatarUrl` 추가 |

- 파일 저장 위치는 계획에서 정한다. 지금 `static/`이 있지만 운영에서는 객체 저장소(S3 호환)를 권한다.
  URL은 서명 URL이나 사용자 id가 드러나지 않는 키를 쓴다.

### 오류 코드

`AVATAR_TOO_LARGE`(413), `AVATAR_UNSUPPORTED_TYPE`(415)

## §3. 계정 삭제: soft delete (6단계)

설정 "계정 삭제"(I6). 시안은 이름을 그대로 입력해야 지울 수 있고, 회고, 할 일, AI 대화가 모두 지워지며 되돌릴 수 없다고 안내한다.

**결정(2026-11-16): soft delete.** 요청 때는 `users.deleted_at`만 채워 계정을 막고, 데이터는 바로 지우지 않는다.
사용자 쪽에서 되살리는 기능은 없다(시안 문구 "되돌릴 수 없다"와 맞음).

### API

`DELETE /auth/me`

- 요청: `{ "confirm": "<표시 이름 또는 이메일>" }`. 서버도 값을 비교한다.
- 최근 로그인 확인: access token 발급 시각이 10분 이내가 아니면 `AUTH_REAUTH_REQUIRED`(401이 아닌 403. FE의 자동 refresh와 겹치지 않게).
- 응답 204. 아래 "요청 때 하는 일"은 같은 트랜잭션에서 끝내고, 외부 토큰 철회만 작업으로 넘긴다.

### 요청 때 하는 일 (동기)

1. `users.deleted_at = now()`
2. 모든 refresh 세션 삭제(기존 세션 API의 "모든 기기 로그아웃"과 같은 경로)
3. access token 막기: 지금 `get_current_user`는 JWT만 보고 DB를 읽지 않아서, 남은 access token이 최대 15분
   (`access_token_expire_minutes`) 더 통한다. Redis에 `deleted_user:{id}`를 TTL 15분으로 두고 `get_current_user`에서 확인한다
   (요청마다 DB를 읽지 않으려고).
4. `oauth_connections`, Google Calendar 연결 행 삭제. 이 행들이 있으면 같은 GitHub, Google 계정으로 다시 가입할 수 없다
   (`uq_oauth_connections_provider_user`).
5. 작업 `worker.revoke_account_tokens`에 GitHub, Google 토큰을 넘겨 철회(실패해도 재시도 3번 뒤 끝냄).

### 지운 계정이 막히는 곳

- 로그인, OAuth 로그인, refresh: 지운 계정은 없는 계정처럼 처리한다. 같은 이메일로 **새로 가입할 수 있다**.
  이를 위해 `users.email`의 `unique=True`를 부분 유니크 인덱스 `UNIQUE(email) WHERE deleted_at IS NULL`로 바꾼다.
- 사용자를 고르는 모든 beat 작업(요약, 캘린더 동기화와 보내기, 임베딩, 주제 정리, 알림, 이메일, AI 예약)에
  `users.deleted_at IS NULL`을 건다. 한곳에서 쓰도록 사용자 조회 리포지토리에 "활성 사용자" 조회를 둔다.
- 이메일 발송(04 §5)은 지운 계정에 보내지 않는다.

### 완전 삭제 (30일 뒤)

soft delete한 개인정보를 기한 없이 두지 않도록 작업 `worker.purge_deleted_accounts`(하루 한 번)가
`deleted_at`이 30일 지난 계정을 완전히 지운다. 30일로 정했다(2026-11-16, 휴지통 12 §1과 같은 기간).

지우는 순서: 사용자 데이터(todos, journal_entries, folders, templates, summaries, topics와 digest, chunk, embedding,
notifications, settings, github 저장소 연결, push 기록, user_tags, calendars, AI 데이터, 내보내기 파일, 프로필 사진) → users 행.
Google Calendar에 보낸 일정은 지우지 않는다(사용자의 Google 캘린더 데이터라서).

### 마이그레이션

`users.deleted_at TIMESTAMPTZ NULL`, `users.email` 유니크 제약을 부분 유니크 인덱스로 교체.

### 테스트

- 삭제 직후 남은 access token으로 부르면 401
- 지운 계정의 이메일, GitHub 계정으로 새로 가입하면 새 사용자 id
- 지운 사용자는 beat 작업 대상에서 빠짐(요약, 동기화, 알림)
- 30일 경계에서 완전 삭제, 29일째는 남음
