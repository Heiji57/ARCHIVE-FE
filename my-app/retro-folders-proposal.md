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
- **중첩**: 폴더 안에 폴더를 만들 수 있다(트리 구조). 깊이 제한은 BE 정책으로
  둘 수 있으나 FE는 제한 없이 렌더링 가능해야 한다(권장: 최대 5단계 정도로
  BE가 422 검증, 무한 중첩 UX 방지).

---

## 1. `Folder` 리소스 (새 태그 `folders`)

### 스키마

```yaml
Folder:
  type: object
  required: [id, name, parentId, sortOrder, createdAt]
  properties:
    id:        { type: string }
    name:      { type: string, maxLength: 60 }
    color:     { type: string, nullable: true }   # 예 "#5E6AD2" (선택)
    parentId:
      type: string
      nullable: true
      description: 상위 폴더 id. 최상위 폴더면 null.
    sortOrder: { type: integer }                   # 같은 부모 내 정렬(오름차순)
    createdAt: { type: string, format: date-time }
    updatedAt: { type: string, format: date-time, nullable: true }
```

- 응답의 snake_case 실제 필드는 `parent_id`, `sort_order`, `created_at`,
  `updated_at`. FE는 `shared/api/mappers.ts` 경계에서 camelCase로 변환한다
  (기존 규칙).
- `GET /folders`는 **평면(flat) 목록**으로 전부 내려주고, FE가 `parentId`로
  트리를 구성한다(entries 를 위한 서버 재귀 조회 없이 클라이언트에서 그룹핑 —
  폴더 개수가 많지 않을 것으로 가정. 개수가 커지면 `parentId` 쿼리 파라미터로
  자식만 지연 조회하는 방식으로 전환 가능, 1차는 불필요).

### 엔드포인트

| Method | Path | 설명 | Body |
|---|---|---|---|
| `POST` | `/folders` | 폴더 생성 | `{ name, color?, parent_id? }` |
| `GET` | `/folders` | 내 폴더 전체 목록(flat, sort_order 오름차순) | — |
| `PATCH` | `/folders/{folder_id}` | 이름/색/순서/**부모 이동** | `{ name?, color?, sort_order?, parent_id? }` |
| `DELETE` | `/folders/{folder_id}` | 폴더 삭제 | — |

- **폴더를 폴더로 이동** = `PATCH /folders/{folder_id}` 에 `parent_id`를 보내는
  것으로 처리한다(엔트리 이동과 마찬가지로 전용 필드, 별도 경로 불필요 — 폴더는
  본문이 없어 upsert 부담이 없으므로 PATCH 하나로 충분).
- **순환 참조 방지(필수)**: `parent_id`를 자기 자신, 또는 자신의 자손 폴더로
  지정하면 안 된다. BE가 이동 시 조상 체인을 검사해 거부해야 한다
  (`FOLDER_CYCLE_NOT_ALLOWED` 등 에러코드). FE는 드래그 UI에서도 1차 방어로
  "자기 자신/자손 위로는 드롭 불가" 처리하지만, 최종 방어는 서버 책임.
- **삭제 시맨틱**:
  - 폴더를 지워도 **안의 회고록은 삭제하지 않는다.** 소속 엔트리의
    `folder_id`를 `null`로 되돌린다(고아 방지).
  - **하위 폴더가 있는 경우**: 자식 폴더도 함께 삭제할지, 부모(`parent_id`)를
    한 단계 위로 승격시킬지는 BE 정책 결정 필요 — 아래 체크리스트 참고.
    FE 기본 가정은 "하위 폴더까지 재귀 삭제(그 안의 엔트리는 미분류로)".
  - 응답은 `ApiResponseEmpty`.
- 에러코드 제안: `FOLDER_NOT_FOUND`, `FOLDER_CYCLE_NOT_ALLOWED`,
  `FOLDER_NAME_DUPLICATED`(같은 유저·같은 부모 내 동일 이름 금지할지는 BE
  판단 — FE는 중복 허용도 감당 가능), `FOLDER_MAX_DEPTH_EXCEEDED`(깊이 제한 둘 경우).

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
- **`folderId`는 해당 폴더 직속 엔트리만.** 하위 폴더에 든 엔트리까지 포함하는
  재귀 조회는 하지 않는다(범위가 커지면 "폴더 안 전체 개수" 의미가 모호해짐).
  하위 폴더 내용을 보려면 그 하위 폴더로 다시 진입한다.
- **중첩에 따른 그리드 구성**: 폴더 진입 시 그리드 맨 위에 그 폴더의 **하위
  폴더 카드들**이 먼저 오고, 그 다음 해당 폴더 직속 엔트리 카드들이 온다(루트
  뷰와 동일한 규칙을 재귀적으로 적용).
- **브레드크럼**: 헤더에 `← 전체 › 2026 회고 › 상반기` 식으로 현재 경로 전체를
  표시(어느 조상이든 클릭해 바로 이동). `parentId` 체인을 FE가 로컬에서 조립
  (`GET /folders` flat 목록을 이미 갖고 있으므로 추가 호출 불필요).

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
  **폴더 카드도 자신이 `useDraggable`이면서 동시에 `useDropTarget`**이 되어야
  한다(다른 폴더 카드 위로 드래그 = 하위 폴더로 이동).
- 폴더 트리 조립 유틸(`parentId` → children map, 브레드크럼 경로 계산) 신규.
- 드래그 중 순환 방지 가드: 드래그 중인 폴더의 자손 위로는 드롭 비활성화
  (서버가 최종 검증하지만 UX상 미리 막아 즉각적 실패 피드백 제공).
- 폴더 CRUD UI(생성/이름변경/삭제/이동) + i18n 키(ko/en/zh/ja).

> DnD 인프라(`shared/lib/dnd`: useDraggable/useDropTarget/DndProvider)는 이미
> 존재하고 칸반에서 쓰이므로 새 라이브러리 추가 없음.

---

## 6. BE에 확인 요청 사항 (체크리스트)

1. `folder_id` 를 `journal_entries` + `retro_summaries` 양쪽에 추가 가능한지.
2. 이동 엔드포인트를 `PATCH /entries/{entry_id}/folder` 단일 경로로 두 id 공간을
   해석할지, 아니면 요약용 별도 경로를 둘지.
3. `GET /folders` 응답에 `item_count`(폴더 카드 뱃지용) 포함 가능한지. 중첩
   구조에서는 "직속만" 셀지 "하위 폴더 포함 총합"으로 셀지도 함께 결정.
4. 폴더명 중복/최대 개수 제한 정책(부모별 중복 금지 등).
5. 폴더 삭제 시 소속 엔트리 `folder_id=null` 처리 확정.
6. **(중첩 관련)** 최대 깊이 제한 여부(예: 5단계)와 초과 시 에러코드.
7. **(중첩 관련)** 폴더 삭제 시 하위 폴더 처리 방식 — 재귀 삭제(그 안 엔트리는
   미분류) vs 하위 폴더를 삭제된 폴더의 부모로 승격.
8. **(중첩 관련)** 순환 참조 검사를 `PATCH /folders/{id}` (parent_id 변경) 시
   서버가 조상 체인 순회로 막아야 함 — 구현 가능 여부 확인.
