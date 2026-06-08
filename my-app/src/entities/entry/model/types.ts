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
}
