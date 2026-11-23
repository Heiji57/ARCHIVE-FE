# 06. topic: 정리 결과 구조화, 목록 보강, 근거 정보

단계: 2단계. 이번 리디자인에서 회고 주제 화면 전체가 이 변경에 기대므로 가장 중요하다.

## 지금

- `Topic(name, description)`, `TopicDigest(status, content, watermark_date_key, last_generated_at,
  incremental_count, full_fingerprint, source_entry_ids)`, `EntryChunk`, `TodoEmbedding`.
- 정리(`worker/tasks/generate_digest.py`)는 매칭한 회고 청크와 할 일을 프롬프트에 싣고,
  Gemini(`topic/infrastructure/ai/gemini_client.py` `generate(prompt) -> str`)가 **markdown 한 편**을 돌려준다.
  `content`에 그대로 저장한다. 증분과 전체 재생성 규칙은 `topic/CLAUDE.md`에 있다.
- `GET /topics` 목록은 주제마다 `entry_count`, `todo_count`, `digest_watermark_date_key`를 준다.
- `GET /topics/{id}/sources`는 근거 목록(`kind, id, title, date_key, retro_type`)을 페이지로 준다.
- `GET /topics/{id}/stats`는 종류별 회고 수, 할 일 수와 완료 수, 태그, 기간, 반영 안 된 회고 수.

## 화면이 필요로 하는 것

시안 `d-retro2.html?area=topic`(명세 1장 "회고 주제" 네 줄).

| 화면 | 필요한 데이터 |
|---|---|
| 주제 카드(한 줄에 두 장) | 이름, 설명, **한 줄 요약**, 기간(처음~마지막 근거 날짜), 회고 수, 할 일 수, 정리 날짜, 새 회고 수, 정리 상태 |
| 좌우로 넘기기 | 위 + **최근에 한 일 다섯 줄**(날짜, 한 일) |
| 본문 상단 | 기간, 회고 수, 할 일 수, 정리 날짜, 한 줄 요약 |
| 큰 주제 거르기 | **큰 주제 목록**(이름, 설명, 기간, 회고 수, 할 일 수) |
| 본문 흐름(하루 카드) | **날짜별 한 일**마다 큰 주제와 **근거(회고 또는 할 일)**, 근거가 할 일이면 **상태**, 회고면 제목과 종류 |
| 자세히 보기 | 그날 회고 전문(기존 `GET /entries/{id}`), 그날 커밋(07 §2), 그날 할 일 상태 |
| 연결 그래프 | 주제 → 큰 주제 → 근거(회고, 할 일) → 그날 커밋. 위 데이터로 FE가 그린다 |

markdown 한 편으로는 큰 주제, 날짜, 근거를 안정적으로 꺼낼 수 없다. 정리 결과를 **구조화**해야 한다.

## §1. 구조화 정리

### 저장

`topic_digests.structured JSONB NULL`을 더한다. `content`(markdown)는 지우지 않고, 구조에서 만들어 함께 저장한다
(옛 클라이언트와 내보내기용).

```json
{
  "version": 1,
  "summary": "월간 무한 스크롤을 끝냈고, 지금은 끌어 놓을 때 마감일이 밀리는 문제를 보고 있어요.",
  "themes": [
    {
      "key": "t1",
      "name": "무한 스크롤",
      "summary": "월간 뷰를 세로 무한 스크롤로 바꾸고, 위로 붙일 때 위치를 보정했어요.",
      "items": [
        { "dateKey": "2026-10-21", "text": "설정 눈금자 손잡이를 고치며 위치 보정 방식을 처음 씀", "source": { "kind": "entry", "id": "<entry uuid>" } },
        { "dateKey": "2026-10-29", "text": "주간 뷰 스크롤 보정을 공용 로직으로 뽑음", "source": { "kind": "todo", "id": "<todo uuid>" } }
      ]
    }
  ]
}
```

### 모델에게 받는 방법

1. **근거에 짧은 표식을 붙여 싣는다.** 회고 청크는 `[E3] 2026-10-30 (daily) ...`, 할 일은
   `[T5] 2026-10-30 done 경계 주 깜빡임 고치기`. 모델은 UUID 대신 `E3`, `T5`로 근거를 가리킨다.
   서버가 표식을 실제 id로 바꾼다. 모델이 id를 지어내는 일을 막는다.
2. **JSON 출력.** `GeminiClient`에 `generate_json(prompt, schema) -> dict`를 더한다
   (`response_mime_type="application/json"`, `response_schema`). 실패하면 한 번 다시 묻고, 그래도 실패하면 정리 실패로 둔다.
3. **서버 검증과 정리.**
   - 모르는 표식을 가리키는 항목은 버린다. 항목이 하나도 남지 않은 큰 주제도 버린다.
   - `dateKey`는 서버가 **근거의 날짜로 채운다**(회고는 `date_key`, 할 일은 `date_key`). 모델이 준 날짜는 쓰지 않는다.
   - 큰 주제는 가장 이른 항목 날짜 순으로 정렬하고 `key`를 `t1`부터 다시 매긴다. FE가 순서로 색을 정하므로 순서가 안정적이어야 한다.
   - 상한: 큰 주제 2~6개(근거가 3개 이하면 1개 허용), 큰 주제당 항목 12개, `name` 20자, `summary` 100자, 항목 `text` 120자.
   - 같은 근거가 여러 큰 주제에 들어가는 것은 허용한다(그래프에서 여러 선으로 보인다).
4. **증분 정리.** 직전 `content` 대신 직전 `structured`를 싣고, "큰 주제의 이름과 순서를 유지하고, 새 근거는 맞는 큰 주제에
   넣거나 새 큰 주제를 만들 것, 바뀐 서술은 제자리에서 고칠 것"을 지시한다. 지금의 증분과 전체 재생성 판단 규칙은 그대로 쓴다.
5. **프롬프트 버전.** `_PROMPT_VERSION`을 `"4"`로 올린다. `full_fingerprint`가 달라져 다음 정리는 전체 재생성이 된다.

### 기존 정리 처리

- 마이그레이션은 컬럼만 더한다. 기존 정리는 `structured = null`로 남는다.
- **한꺼번에 다시 만들지 않는다**(비용). FE는 `structured`가 없으면 "다시 정리하면 날짜별로 볼 수 있어요"와 정리하기를 보여 준다.
  사용자가 누르면 기존 생성 API로 다시 만든다.
- 필요하면 관리자 명령으로 최근 30일 안에 열어 본 주제만 천천히 다시 만든다(사용자별 상한 적용).

### markdown 만들기

`content`는 구조에서 만든다: `## {theme.name}`, 다음 줄에 `{summary}`, 그 아래 `- {M/D} {text}`. 첫 줄은 `summary`.

## §2. 정리 응답에 근거 정보

`GET /topics/{id}/digest` 응답에 더한다(더하기만 하므로 v1 그대로).

```json
{
  "status": "completed",
  "content": "...",
  "structured": { ... },
  "watermarkDateKey": "2026-11-02",
  "sources": {
    "<entry uuid>": { "kind": "entry", "title": "토큰 재발급 루프 잡은 날", "dateKey": "2026-11-02", "retroType": "daily" },
    "<todo uuid>": { "kind": "todo", "title": "경계 케이스 테스트 추가", "dateKey": "2026-10-31", "status": "not-start" }
  }
}
```

- `sources`는 `structured` 안에서 가리키는 근거만 담는다. 하루 카드의 근거 이름, 할 일 상태, 종류 아이콘이 여기서 나온다.
- 할 일 상태는 **지금 값**이다(정리 시점 값이 아님). 정리 뒤에 끝낸 할 일은 끝냄으로 보인다.
- 지운 근거(휴지통, 영구 삭제)는 `sources`에서 빠지고, FE는 그 항목을 흐리게 "지운 자료"로 보여 준다.
- 응답 필드 이름 표기는 지금 `TopicDigestResponse` 규칙을 따른다(위 예시는 FE 표기).

## §3. 목록 보강

`GET /topics`의 각 주제에 더한다.

| 필드 | 값 | 출처 |
|---|---|---|
| `digest_status` | `none` \| `pending` \| `in_progress` \| `completed` \| `failed` | 최신 digest |
| `digest_summary` | 한 줄 요약 또는 null | `structured.summary` |
| `period_start_date_key`, `period_end_date_key` | 근거의 처음과 마지막 날짜 | `structured` 항목 날짜의 최소, 최대(정리 전이면 매칭 결과에서) |
| `unreflected_entry_count` | 정리 뒤에 쓴 회고 수 | stats와 같은 계산 |
| `recent_items` | 최근에 한 일 최대 5개 `[{ dateKey, text, themeKey }]` | `structured`에서 오늘 이전 항목을 날짜 내림차순 |

- `recent_items`는 좌우로 넘기기에서만 쓰므로 `GET /topics?include=recent`일 때만 채운다.
- N+1을 피한다: 사용자의 최신 digest를 한 번에 읽고, 개수는 기존 `topic_stats_cache`를 쓴다.

## §4. 근거 목록 보강

`GET /topics/{id}/sources` 항목에 할 일 `status`를 더한다. 연결 그래프에서 근거 목록 화면을 따로 열 때 쓴다.

## §5. 주제 색: 서버 변경 없음

**결정(2026-11-16): 시안대로 FE가 정한다.** 시안은 사용자가 색을 고르는 곳이 없고, 주제 4색을 차례로 돌려 쓴다.
서버에 저장할 값이 없으므로 `topics.color`는 만들지 않는다.

FE 참고: 시안은 목록 위치로 색을 정해서, 주제를 지우거나 정렬이 바뀌면 다른 주제의 색이 바뀐다.
실제 앱은 `created_at` 순서(또는 id 해시)로 정해 색이 고정되게 한다. 두 값 모두 지금 응답에 있다.

## §6. 연결 그래프

새 엔드포인트를 만들지 않는다. FE가 아래를 합쳐 그린다.

- 주제와 큰 주제: `structured.themes`
- 큰 주제와 근거: `themes[].items[].source`
- 근거 이름, 종류, 상태: `sources`(§2)
- 회고와 그날 커밋: 근거 회고 날짜들의 기간으로 `GET /github/commits?from=&to=`(07 §2) 한 번

이렇게 하면 그래프 전용 캐시나 계산이 없다. 근거가 수백 개로 커지면 그때 `GET /topics/{id}/graph`를 검토한다.

## 오류와 상태

- JSON 검증 실패가 두 번이면 digest `status = failed`, `error_code = DIGEST_INVALID_OUTPUT`(로그에 원문 일부). 사용자 응답 코드는 기존 실패 흐름과 같다.
- 사용자별 정리 상한은 기존 `digest_rate_limiter` 그대로.

## 테스트

- 표식 바꾸기: 모르는 표식 버림, 빈 큰 주제 버림, 날짜는 근거 날짜로
- 큰 주제 정렬과 `key` 다시 매기기가 증분 정리 뒤에도 같은 순서인지
- 근거 3개 이하에서 큰 주제 1개 허용
- `structured = null`인 기존 정리의 응답
- 목록 쿼리 수(주제 20개에서 쿼리 수가 주제 수에 비례하지 않음)
- 휴지통 이후: 지운 근거가 `sources`에서 빠짐
