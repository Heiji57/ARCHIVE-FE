/**
 * GitHub 연동 도메인 타입 — 서버(api.yaml github 태그) 모델을 따른다.
 *
 * 연결(인증)은 서버가 "GitHub OAuth 로그인 access_token 재사용" 방식이라
 * 별도 연결 객체가 없다. 연결 여부는 저장소 조회가 GITHUB_CONNECTION_NOT_FOUND
 * 를 던지는지로 판별한다(= status).
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

/**
 * GitHub 연결 상태.
 *  - "unknown": 아직 확인 전(프로브 미완료)
 *  - "connected": GitHub OAuth 토큰이 서버에 있어 저장소 API 사용 가능
 *  - "not-connected": GITHUB_CONNECTION_NOT_FOUND (GitHub 계정 연결 필요)
 */
export type GitHubStatus = "unknown" | "connected" | "not-connected";

export interface GitHubState {
  status: GitHubStatus;
  linkedRepositories: LinkedRepository[];
}

export const INITIAL_GITHUB_STATE: GitHubState = {
  status: "unknown",
  linkedRepositories: [],
};
