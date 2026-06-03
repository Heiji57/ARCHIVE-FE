/**
 * Mock GitHub 저장소 데이터 (USE_API=false 일 때만 사용).
 * 실제 백엔드가 없으면 이 데이터로 저장소 연결 UI 흐름을 시연한다.
 */
import type {
  AvailableRepository,
  LinkedRepository,
} from "@/entities/github/model/types";

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
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
}
