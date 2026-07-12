# 회고록 폴더 기능 — 백엔드 계약 제안 (쪽지)

> 상태: **제안 / BE 협의 대기.** 아직 `api.yaml`에 반영하지 않았다.
> FE는 이 계약이 `api.yaml`에 확정된 뒤 `pnpm gen:api` → 구현에 착수한다.
> 작성 배경: 갤러리에 **인라인 폴더 카드**를 두고, 회고 카드를 폴더 카드로
> **drag & drop** 하여 정리하는 기능. 폴더 대상 범위는 **모든 엔트리 타입**
> (daily 일간 회고 + weekly/monthly/annual AI 요약). **폴더 안에 폴더(중첩)도
> 지원한다.**

---

## 0. 결정된 사항

- **저장 위치**: 백엔드(서버 영속, 다기기 동기화). FE localStorage 아님.
- **UI**: 갤러리 그리드 안 인라인 폴더 카드. 카드를 폴더 카드로 드래그 = 이동.
- **범위**: 모든 타입. `folder_id`가 `journal_entries` **와** `retro_summaries`
  양쪽에 존재해야 한다.
- **관계**: 회고록 1개 = 최대 폴더 1개 (1:N). "옮기다" 의미에 맞춤.

---

## 1. `Folder` 리소스 (새 태그 `folders`)

### 스키마

```yaml
Folder:
  type: object
  required: [id, name, sortOrder, createdAt]
  properties:
    id:        { type: string }
    name:      { type: string, maxLength: 60 }
    color:     { type: string, nullable: true }   # 예 "#5E6AD2" (선택)
    sortOrder: { type: integer }                   # 사용자 지정 정렬(오름차순)
    createdAt: { type: string, format: date-time }
    updatedAt: { type: string, format: date-time, nullable: true }
```

- 응답의 snake_case 실제 필드는 `sort_order`, `created_at`, `updated_at`.
  FE는 `shared/api/mappers.ts` 경계에서 camelCase로 변환한다(기존 규칙).

### 엔드포인트

| Method | Path | 설명 | Body |
|---|---|---|---|
| `POST` | `/folders` | 폴더 생성 | `{ name, color? }` |
| `GET` | `/folders` | 내 폴더 목록(sort_order 오름차순) | — |
| `PATCH` | `/folders/{folder_id}` | 이름/색/순서 변경 | `{ name?, color?, sort_order? }` |
| `DELETE` | `/folders/{folder_id}` | 폴더 삭제 | — |

- **삭제 시맨틱**: 폴더를 지워도 **안의 회고록은 삭제하지 않는다.** 소속 엔트리의
  `folder_id`를 `null`로 되돌린다(고아 방지). 응답은 `ApiResponseEmpty`.
- 에러코드 제안: `FOLDER_NOT_FOUND`, `FOLDER_NAME_DUPLICATED`(같은 유저 내 동일
  이름 금지할지는 BE 판단 — FE는 중복 허용도 감당 가능).

---

## 2. 엔트리 ↔ 폴더 연결: `folder_id` 필드 추가

`EntryResponse`에 필드 추가:

```yaml
EntryResponse:
  properties:
    # ... 기존 필드 ...
    folder_id:
      type: string
      nullable: true
      description: |
        소속 폴더 id. 미분류면 null. journal_entries·retro_summaries 양쪽 모두에
        존재. GET /entries, GET /entries/paginated 응답 모두 이 키를 포함한다(값만 null).
```

- **모든 타입 지원이므로 `folder_id` 컬럼이 `journal_entries` 와 `retro_summaries`
  두 테이블 모두에 필요하다.** (isSummary=true 항목도 폴더에 들어갈 수 있음)

---

## 3. 이동(드래그) 전용 엔드포인트

`EntryUpsertRequest`(date_key/title/content 필수)를 재사용하면 드래그 한 번에
전체 본문을 보내야 해서 부적합. `todos/{id}/calendar-link` 처럼 **초점 잡힌
서브 액션**으로 둔다.

```
PATCH /entries/{entry_id}/folder
body: { "folder_id": "<folderId>" | null }
```

- `folder_id: null` = 폴더에서 빼기(미분류로).
- 성공 시 갱신된 `EntryResponse` 반환(`ApiResponseEntry`).
- **중요(모든 타입):** `entry_id`는 **journal_entry id 또는 retro_summary id**
  둘 다 올 수 있다. BE가 id로 소스 테이블을 판별해 해당 행의 `folder_id`를
  갱신해야 한다. (paginated 응답의 `isSummary`로 FE는 출처를 알지만, 이동 API는
  id만 보낸다 → **BE 측 id 해석 필요**.)
  - 만약 두 id 공간을 한 경로로 해석하기 어렵다면 대안:
    `PATCH /summaries/{summary_id}/folder` 를 별도로 두는 방식도 가능.
    FE는 어느 쪽이든 맞출 수 있으니 BE가 구현하기 쉬운 쪽을 택하면 된다.
- 에러코드 제안: `FOLDER_NOT_FOUND`(대상 폴더 없음), `JOURNAL_ENTRY_NOT_FOUND` /
  요약 미존재.

---

## 4. 폴더별 조회 필터: `GET /entries/paginated` 에 `folderId` 추가

```yaml
- in: query
  name: folderId
  schema: { type: string }
  description: |
    지정 시 해당 폴더 소속 항목만. retroType 와 AND 결합(retroType 은 여전히 필수).
    미지정 시 폴더 무관 전체(기존 동작).
```

- 폴더 카드를 클릭해 "진입"하면 이 필터로 조회.
- **주의(소스 분리):** paginated는 `retroType` 필수(daily=journal_entries,
  weekly+=retro_summaries). 따라서 폴더 안에서도 타입 칩(일간/주간/월간/연간)은
  그대로 유지되고, `folderId + retroType` 조합으로 타입별 조회된다.
  "폴더 안 전체 타입을 한 화면에" 보여주려면 FE가 타입별로 각각 호출해 합쳐야
  하므로, 1차 구현은 **폴더 진입 후에도 타입 칩으로 전환**하는 방식을 기본으로 한다.

### (선택) 미분류 개수/폴더별 카운트
- 갤러리 인라인 폴더 카드에 "N개" 뱃지를 붙이려면 폴더별 항목 수가 필요.
  `GET /folders` 응답에 `item_count`(또는 타입별 카운트)를 포함해 주면 FE가
  추가 조회 없이 뱃지를 그릴 수 있다. 없으면 뱃지는 생략하거나 지연 로딩.

---

## 5. FE 영향 요약 (계약 확정 후 작업)

- `shared/api/schema.d.ts` 재생성(`pnpm gen:api`).
- `shared/api/` 에 `folders.ts` 신규(+ `index.ts` 배럴), `entries.ts` 에 이동 함수.
- `shared/api/mappers.ts` 에 Folder / entry.folderId 매핑.
- `entities/` 에 `folder` 엔티티(타입 + 셀렉터) 신규, `JournalEntry` 에 `folderId` 추가.
- `widgets/retrospective-studio` 에 폴더 카드 렌더 + `useDropTarget` 드롭 존,
  `RetroCard` 에 `useDraggable`(기존 `shared/lib/dnd` 재사용, 칸반과 동일 패턴).
- 폴더 CRUD UI(생성/이름변경/삭제) + i18n 키(ko/en/zh/ja).

> DnD 인프라(`shared/lib/dnd`: useDraggable/useDropTarget/DndProvider)는 이미
> 존재하고 칸반에서 쓰이므로 새 라이브러리 추가 없음.

---

## 6. BE에 확인 요청 사항 (체크리스트)

1. `folder_id` 를 `journal_entries` + `retro_summaries` 양쪽에 추가 가능한지.
2. 이동 엔드포인트를 `PATCH /entries/{entry_id}/folder` 단일 경로로 두 id 공간을
   해석할지, 아니면 요약용 별도 경로를 둘지.
3. `GET /folders` 응답에 `item_count`(폴더 카드 뱃지용) 포함 가능한지.
4. 폴더명 중복/최대 개수 제한 정책.
5. 폴더 삭제 시 소속 엔트리 `folder_id=null` 처리 확정.
