/**
 * Mock GitHub 데이터 (USE_API=false 일 때만 사용).
 * 실제 백엔드가 없으면 이 데이터로 저장소 연결 UI 흐름을 시연한다.
 */
import type {
  AvailableRepository,
  GitHubCommit,
  LinkedRepository,
} from "@/entities/github/model/types";

export const MOCK_LOGIN = "developer";

export const MOCK_AVAILABLE_REPOS: AvailableRepository[] = [
  {
    githubRepoId: 101,
    owner: "developer",
    name: "archive-backend",
    fullName: "developer/archive-backend",
    isPrivate: false,
    defaultBranch: "main",
    htmlUrl: "https://github.com/developer/archive-backend",
  },
  {
    githubRepoId: 102,
    owner: "developer",
    name: "archive-frontend",
    fullName: "developer/archive-frontend",
    isPrivate: false,
    defaultBranch: "main",
    htmlUrl: "https://github.com/developer/archive-frontend",
  },
  {
    githubRepoId: 103,
    owner: "developer",
    name: "my-personal-website",
    fullName: "developer/my-personal-website",
    isPrivate: true,
    defaultBranch: "main",
    htmlUrl: "https://github.com/developer/my-personal-website",
  },
];

/** AvailableRepository → LinkedRepository 로 변환(연결 시점 메타 합성). */
export function mockLinkRepository(repo: AvailableRepository): LinkedRepository {
  return {
    id: `ghrepo_mock_${repo.githubRepoId}`,
    githubRepoId: repo.githubRepoId,
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    isPrivate: repo.isPrivate,
    defaultBranch: repo.defaultBranch,
    htmlUrl: repo.htmlUrl,
    commitReadEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
}

/** 오늘의 mock 커밋 목록 */
export const MOCK_COMMITS: GitHubCommit[] = [
  {
    repositoryId: "ghrepo_mock_101",
    fullName: "developer/archive-backend",
    sha: "a1b2c3d",
    message: "feat: add GitHub retrospective push API",
    htmlUrl:
      "https://github.com/developer/archive-backend/commit/a1b2c3d",
    author: "developer",
    committedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    repositoryId: "ghrepo_mock_101",
    fullName: "developer/archive-backend",
    sha: "f9e8d7c",
    message: "fix: redis connection timeout handling",
    htmlUrl:
      "https://github.com/developer/archive-backend/commit/f9e8d7c",
    author: "developer",
    committedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    repositoryId: "ghrepo_mock_102",
    fullName: "developer/archive-frontend",
    sha: "c3d4e5f",
    message: "feat: GitHub commit list in retro editor",
    htmlUrl:
      "https://github.com/developer/archive-frontend/commit/c3d4e5f",
    author: "developer",
    committedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];
