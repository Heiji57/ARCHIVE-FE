import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { TaskStatus } from "@/entities/todo/model/types";

export type DigestStatus = "pending" | "in_progress" | "completed" | "failed";

export interface Topic {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  /**
   * 이 주제에 묶이는 회고/할 일 수. **목록(GET /topics)에서만 채워진다** — 생성/수정
   * 단건 응답에서는 null(백엔드가 그렇게 정의함). 임베딩 API 장애·쿼터 초과 시에도
   * 목록 자체는 200으로 오고 카운트만 null — 이 경우 숫자 없이 렌더링해야 한다.
   * pill 숫자는 entryCount + todoCount 를 소비 측에서 합산한다(둘 중 하나라도
   * null이면 합계도 표시하지 않는다).
   */
  entryCount: number | null;
  todoCount: number | null;
  /** 마지막 정리 시점(YYYY-MM-DD). 정리한 적 없으면 null. */
  digestWatermarkDateKey: string | null;
}

export interface TopicDigest {
  id: string;
  topicId: string;
  status: DigestStatus;
  content: string | null;
  watermarkDateKey: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface TopicEntryCounts {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  total: number;
}

export interface TopicTodoCounts {
  /** 매칭 규칙상 not-start 상태 할 일은 제외된다. */
  total: number;
  completed: number;
}

export interface TopicTagCount {
  tag: string;
  count: number;
}

export interface TopicStats {
  topicId: string;
  entryCounts: TopicEntryCounts;
  todoCounts: TopicTodoCounts;
  /** 상위 20개로 잘린 목록. 전체 종류 수는 tagCountTotal. */
  tagCounts: TopicTagCount[];
  tagCountTotal: number;
  periodStartDateKey: string | null;
  periodEndDateKey: string | null;
  /** watermarkDateKey 이후(초과) 날짜의 매칭 회고 수. digest 없으면 전체 매칭 회고 수. */
  unreflectedEntryCount: number;
}

export type TopicSourceKind = "entry" | "todo";

export interface TopicSource {
  kind: TopicSourceKind;
  id: string;
  title: string;
  dateKey: string;
  /** 회고면 회고 종류, 할 일이면 null. */
  retroType: RetrospectiveType | null;
}

export interface TopicSourcePage {
  items: TopicSource[];
  total: number;
  page: number;
  size: number;
  /** 이 목록은 요청 시점 재계산 결과 — 이 날짜 이후 항목은 아직 digest에 반영 안 됨. */
  digestWatermarkDateKey: string | null;
}

// ─── 구조화 정리 결과 (서버 요청 06-topic §1, §2. 아직 api.yaml 에 없음) ────────────
// 실제 모드에서는 useServerFeature("topicStructured") 가 false 라 쓰지 않는다.
// 데모 모드(entities/topic/model/demo.ts)와 화면 모델이 이 모양을 쓴다.

/** 정리 항목이 가리키는 근거. id 는 회고(entry) 또는 할 일(todo) id. */
export interface TopicSourceRef {
  kind: TopicSourceKind;
  id: string;
}

/** 큰 주제 안의 "날짜별 한 일" 한 줄. dateKey 는 서버가 근거 날짜로 채운다. */
export interface TopicThemeItem {
  dateKey: string;
  text: string;
  source: TopicSourceRef;
}

/** 큰 주제. 서버가 가장 이른 항목 날짜 순으로 정렬하고 key 를 t1 부터 매긴다. */
export interface TopicTheme {
  key: string;
  name: string;
  summary: string;
  items: TopicThemeItem[];
}

export interface TopicStructured {
  version: 1;
  /** 한 줄 요약 */
  summary: string;
  themes: TopicTheme[];
}

/** 근거 정보(§2 `sources`). 할 일 상태는 정리 시점이 아니라 지금 값. */
export type TopicSourceInfo =
  | { kind: "entry"; title: string; dateKey: string; retroType: RetrospectiveType }
  | { kind: "todo"; title: string; dateKey: string; status: TaskStatus };

/** 근거 id → 정보. 지운 근거는 빠져 있다(화면은 "지운 자료"로 흐리게). */
export type TopicSourceMap = Record<string, TopicSourceInfo>;
