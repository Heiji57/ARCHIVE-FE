# 07. github: 개발자 조건 제거, 기간 커밋 조회

단계: §1은 0단계, §2는 2단계.

## 지금

- 라우터 전체가 `_require_developer`로 막혀 있다(개발자가 아니면 403 `DeveloperAccountRequiredException`).
- `GET /github/commits?date=`는 날짜 하나의 커밋을 GitHub API에서 그때그때 가져온다(public 저장소, 커밋 읽기를 켠 저장소).
  응답: `{ commits: [{ repositoryId, fullName, sha, message, htmlUrl, author, committedAt }], failedRepositories }`.
  저장하지 않는다.

## §1. 개발자 조건 제거 (0단계)

`01-auth-user.md` §1과 같은 변경. `_require_developer` 의존성을 라우터에서 지운다.
GitHub 연결이 없으면 각 유스케이스의 기존 "연결 없음" 응답이 나간다.

## §2. 기간 커밋 조회 (2단계)

### 쓰는 화면

- 회고 주제 연결 그래프: 근거 회고 날짜들의 커밋을 한 번에(06 §6)
- 오른쪽 패널 커밋 탭(세로 시간 줄): 지금처럼 하루씩이라 변경 없음
- AI 추천의 "커밋과 맞는 할 일"(11 §2)

### API

`GET /github/commits?from=YYYY-MM-DD&to=YYYY-MM-DD`

- `date`와 함께 쓰지 않는다(함께 오면 422). `date`만 쓰는 기존 호출은 그대로.
- 기간 상한 31일. 넘으면 `GITHUB_RANGE_TOO_LONG`(422).
- 응답은 기존 `CommitListResponse`에 `dateKey`(사용자 시간대 기준 커밋 날짜)를 커밋마다 더한 것.
  FE는 `dateKey`로 묶는다.
- 날짜 기준은 사용자 시간대. GitHub `since`, `until`은 그 기간의 UTC 경계로 바꿔 보낸다.

### 캐시

- 기간 조회는 저장소 수 × 페이지만큼 GitHub를 부르므로 캐시가 필요하다.
- 키: `gh:commits:{user_id}:{repo_id}:{date_key}`, 값: 그날 커밋 목록.
- **오늘과 어제**는 5분, 그 이전은 24시간. 저장소 연결이나 커밋 읽기 설정이 바뀌면 그 사용자 키를 지운다.
- 하루 조회(`date=`)도 같은 캐시를 쓰게 바꾼다.
- 레이트 리밋에 걸리면 받은 날까지만 돌려주고 나머지 저장소를 `failedRepositories`에 넣는다(지금 실패 처리와 같은 모양).

## 테스트

- 일반 계정 + 연결: 200
- 기간 32일 거절, `date`와 `from` 함께 거절
- 시간대 경계: 사용자 시간대 자정 근처 커밋의 `dateKey`
- 캐시 적중과 무효화(저장소 해제 후)
