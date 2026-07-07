export type RetrospectiveType = "daily" | "weekly" | "monthly" | "yearly";

/** 서버의 GithubPushResponse — push 기록이 있을 때만 존재. */
export interface GithubPush {
  pushedAt: string;
  commitSha: string;
  htmlUrl: string;
  path: string;
  repositoryFullName: string;
}

export interface JournalEntry {
  id: string;
  dateKey: string;
  content: string;
  updatedAt: string;
  title: string;
  /** 서버가 내려준 push 레코드. null = 미push. */
  githubPush: GithubPush | null;
  /**
   * UI 표시용 동기화 상태.
   * USE_API=true 일 때는 githubPush != null 이면 true.
   * mock 모드에서는 로컬 상태 그대로.
   */
  synced: boolean;
  retroType: RetrospectiveType;
  /**
   * true 면 이 entry 는 AI 요약(retro_summaries) 에서 온 것이다 (daily 회고와 구분).
   * 요약은 /summaries 가 진실 공급원이라 /entries 로 저장하지 않는다(편집 미영속).
   */
  isSummary?: boolean;
  /**
   * 요약 생성 상태(isSummary=true 일 때만 의미 있음). GET /entries/paginated 는
   * 미완성 요약도 placeholder 로 내려줄 수 있다 — pending/in_progress/failed 는
   * 읽기 전용 편집기에 본문 대신 상태 안내를 보여줘야 한다. daily 회고는 항상 null.
   */
  status?: "pending" | "in_progress" | "completed" | "failed" | null;
}
