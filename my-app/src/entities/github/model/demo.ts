import type { GitHubCommit, GitHubState, LinkedRepository } from "./types";

/**
 * 데모 모드 GitHub 데이터(시안 shared.js A.commits). 데모 모드에서만 읽는다.
 * 시각은 데모 기준일(2026-11-03)의 브라우저 로컬 시각으로 만든다.
 */
const at = (dateKey: string, h: number, m: number): string => {
  const [y, mo, d] = dateKey.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m).toISOString();
};

const repo = (id: string, name: string, githubRepoId: number): LinkedRepository => ({
  id,
  githubRepoId,
  owner: "developer",
  name,
  fullName: `developer/${name}`,
  isPrivate: false,
  defaultBranch: "main",
  htmlUrl: `https://github.com/developer/${name}`,
  commitReadEnabled: true,
  createdAt: at("2026-10-01", 9, 0),
  updatedAt: null,
});

export const DEMO_REPOSITORIES: readonly LinkedRepository[] = [
  repo("ghrepo_demo_fe", "archive-fe", 1001),
  repo("ghrepo_demo_docs", "archive-docs", 1002),
];

const commit = (
  sha: string,
  repoIdx: 0 | 1,
  dateKey: string,
  h: number,
  m: number,
  message: string,
): GitHubCommit => {
  const r = DEMO_REPOSITORIES[repoIdx];
  return {
    repositoryId: r.id,
    fullName: r.fullName,
    sha,
    message,
    htmlUrl: `${r.htmlUrl}/commit/${sha}`,
    author: "developer",
    committedAt: at(dateKey, h, m),
  };
};

export const DEMO_COMMITS: readonly GitHubCommit[] = [
  commit("c1a2b3c", 0, "2026-11-03", 9, 5, "review: PR #14 의견 반영"),
  commit("c2d4e5f", 0, "2026-11-03", 10, 10, "chore: 의존성 업데이트"),
  commit("c3a7b8c", 0, "2026-11-03", 13, 10, "fix(calendar): 드래그 시 dueDate 이동"),
  commit("c4d9e0f", 0, "2026-11-03", 14, 0, "test: DnD 경계 케이스"),
  commit("c5a1b2c", 0, "2026-11-02", 14, 30, "fix(auth): 토큰 재발급 루프"),
  commit("c6d3e4f", 1, "2026-11-02", 17, 0, "docs: 설정 가이드"),
];

/**
 * 커밋과 이어진 데모 할 일(시안 commits.todoId). 서버는 이 연결을 아직 주지 않는다.
 * 키는 커밋 sha, 값은 할 일 id.
 */
export const DEMO_COMMIT_TODO_LINKS: Readonly<Record<string, string>> = {
  c1a2b3c: "demo-t1",
  c3a7b8c: "demo-t3",
  c4d9e0f: "demo-t3",
  c5a1b2c: "demo-t10",
};

/** 그 날(로컬)의 데모 커밋. date 를 빼면 전부. */
export function demoCommitsOn(dateKey?: string): GitHubCommit[] {
  if (!dateKey) return [...DEMO_COMMITS];
  return DEMO_COMMITS.filter((c) => {
    const d = new Date(c.committedAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return k === dateKey;
  });
}

/**
 * 데모 모드 GitHub 상태: 연결됨, 저장소 둘. 이메일 권한(hasVerifiedEmails)이 없어
 * 사이드바 "연동 문제"에 "GitHub 권한 필요"가 보인다(시안과 같음).
 */
export const DEMO_GITHUB_STATE: GitHubState = {
  status: "connected",
  login: "developer",
  linkedRepositories: [...DEMO_REPOSITORIES],
  pushTargetRepositoryId: DEMO_REPOSITORIES[0].id,
  commits: demoCommitsOn("2026-11-03"),
  hasVerifiedEmails: false,
};
