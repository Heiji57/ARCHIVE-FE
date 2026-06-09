/**
 * GitHub 연동 도메인 타입 — 서버(api.yaml github 태그) 모델을 따른다.
 */

/** DB 에 연결(link)된 저장소 (RepositoryResponse) */
export interface LinkedRepository {
  /** 백엔드 발급 연결 ID (`ghrepo_...`) */
  id: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  htmlUrl: string;
  /** 오늘의 커밋 집계 포함 여부. false 이면 GET /github/commits 에서 제외됨. */
  commitReadEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/** GitHub 에서 실시간 조회한 연결 후보 저장소 (AvailableRepositoryResponse, DB 미저장) */
export interface AvailableRepository {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  htmlUrl: string;
}

/** 오늘의 커밋 (CommitResponse) */
export interface GitHubCommit {
  repositoryId: string;
  fullName: string;
  sha: string;
  message: string;
  htmlUrl: string;
  author: string;
  committedAt: string;
}

/**
 * GitHub 연결 상태.
 *  - "unknown": 아직 확인 전(프로브 미완료)
 *  - "connected": GitHub OAuth 토큰이 서버에 있어 저장소 API 사용 가능
 *  - "not-connected": GITHUB_CONNECTION_NOT_FOUND (GitHub 계정 연결 필요)
 */
export type GitHubStatus = "unknown" | "connected" | "not-connected";

export interface GitHubState {
  status: GitHubStatus;
  /** GitHub username (GET /github/connection 응답의 login 필드) */
  login: string | null;
  linkedRepositories: LinkedRepository[];
  /** 회고 push 대상 저장소 id. null 이면 미설정. */
  pushTargetRepositoryId: string | null;
  /** 오늘의 커밋 목록 (GET /github/commits). */
  commits: GitHubCommit[];
  /**
   * GitHub verified emails 캐시 보유 여부.
   * false = 구 scope(user:email 없음) → commit author 매칭이 login 으로만 동작.
   * UI 에서 재연결 배너를 표시해야 한다.
   */
  hasVerifiedEmails: boolean;
}

export const INITIAL_GITHUB_STATE: GitHubState = {
  status: "unknown",
  login: null,
  linkedRepositories: [],
  pushTargetRepositoryId: null,
  commits: [],
  hasVerifiedEmails: false,
};
