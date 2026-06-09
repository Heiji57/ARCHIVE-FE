/**
 * GitHub 저장소 연동 API (api.yaml github 태그).
 * 연결(인증)은 GitHub OAuth 로그인 토큰 재사용 — OAuth 연결 엔드포인트는 별도 없음.
 */
import type {
  AvailableRepository,
  GitHubCommit,
  LinkedRepository,
} from "@/entities/github/model/types";
import { request } from "./client";
import type { components } from "./schema";

type RepositoryResponse = components["schemas"]["RepositoryResponse"];
type AvailableRepositoryResponse =
  components["schemas"]["AvailableRepositoryResponse"];
type ConnectionStatusResponse =
  components["schemas"]["ConnectionStatusResponse"];
type CommitResponse = components["schemas"]["CommitResponse"];
type CommitListResponse = components["schemas"]["CommitListResponse"];

// ── Mappers ────────────────────────────────────────────────────────────────

function toLinked(api: RepositoryResponse): LinkedRepository {
  return {
    id: api.id,
    githubRepoId: api.githubRepoId,
    owner: api.owner,
    name: api.name,
    fullName: api.fullName,
    isPrivate: api.isPrivate,
    defaultBranch: api.defaultBranch,
    htmlUrl: api.htmlUrl,
    commitReadEnabled: api.commitReadEnabled,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt ?? null,
  };
}

function toAvailable(api: AvailableRepositoryResponse): AvailableRepository {
  return {
    githubRepoId: api.githubRepoId,
    owner: api.owner,
    name: api.name,
    fullName: api.fullName,
    isPrivate: api.isPrivate,
    defaultBranch: api.defaultBranch,
    htmlUrl: api.htmlUrl,
  };
}

function toCommit(api: CommitResponse): GitHubCommit {
  return {
    repositoryId: api.repositoryId,
    fullName: api.fullName,
    sha: api.sha,
    message: api.message,
    htmlUrl: api.htmlUrl,
    author: api.author,
    committedAt: api.committedAt,
  };
}

// ── Connection ──────────────────────────────────────────────────────────────

/** GitHub 연결 상태 + push target + verified emails 통합 조회 (GET /github/connection). */
export async function apiGetConnection(): Promise<{
  connected: boolean;
  login: string | null;
  pushTargetRepositoryId: string | null;
  hasVerifiedEmails: boolean;
}> {
  const res = await request<ConnectionStatusResponse>("/github/connection");
  return {
    connected: res.connected,
    login: res.login ?? null,
    pushTargetRepositoryId: res.pushTargetRepositoryId ?? null,
    hasVerifiedEmails: res.hasVerifiedEmails,
  };
}

// ── Repositories ────────────────────────────────────────────────────────────

/** GitHub 에서 사용자 public 저장소 목록 조회 (연결 후보, DB 미저장). */
export async function apiListAvailableRepos(): Promise<AvailableRepository[]> {
  const list = await request<AvailableRepositoryResponse[]>(
    "/github/repositories/available",
  );
  return list.map(toAvailable);
}

/** DB 에 연결된 저장소 목록 조회. */
export async function apiListLinkedRepos(): Promise<LinkedRepository[]> {
  const list = await request<RepositoryResponse[]>("/github/repositories");
  return list.map(toLinked);
}

/** githubRepoId 로 저장소 1개 연결. */
export async function apiLinkRepo(
  githubRepoId: number,
): Promise<LinkedRepository> {
  const res = await request<RepositoryResponse>("/github/repositories", {
    method: "POST",
    body: { githubRepoId },
  });
  return toLinked(res);
}

/** 저장소 역할(commitReadEnabled) 수정. */
export async function apiUpdateRepo(
  repositoryId: string,
  body: { commitReadEnabled: boolean },
): Promise<LinkedRepository> {
  const res = await request<RepositoryResponse>(
    `/github/repositories/${repositoryId}`,
    { method: "PATCH", body },
  );
  return toLinked(res);
}

/** 모든 저장소 연결 해제. */
export async function apiUnlinkAllRepos(): Promise<void> {
  await request("/github/repositories", { method: "DELETE" });
}

/** 단일 저장소 연결 해제. */
export async function apiUnlinkRepo(repositoryId: string): Promise<void> {
  await request(`/github/repositories/${repositoryId}`, { method: "DELETE" });
}

/** 현재 GitHub 저장소 목록을 모두 일괄 연결(idempotent upsert)하고 결과 목록 반환. */
export async function apiSyncAllRepos(): Promise<LinkedRepository[]> {
  const list = await request<RepositoryResponse[]>(
    "/github/repositories/sync-all",
    { method: "POST" },
  );
  return list.map(toLinked);
}

// ── Commits ─────────────────────────────────────────────────────────────────

/**
 * 오늘(또는 지정 날짜)의 커밋 목록 조회.
 * @param date YYYY-MM-DD (생략 시 user.timezone 기준 오늘 — 서버가 계산)
 *
 * 서버 응답: { commits: CommitResponse[], failedRepositories: [...] }
 * (구버전 FE 가 CommitResponse[] 직접 배열을 기대했으나, api.yaml 갱신으로 래퍼 객체 형태)
 */
export async function apiGetCommits(date?: string): Promise<GitHubCommit[]> {
  const res = await request<CommitListResponse>("/github/commits", {
    query: date ? { date } : undefined,
  });
  // failedRepositories 는 현재 무시 (부분 실패 — 나머지 커밋은 표시)
  return (res.commits ?? []).map(toCommit);
}

// ── Retrospective Push ───────────────────────────────────────────────────────

export interface PushRetrospectivePayload {
  periodType: "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUAL";
  periodKey: string;
  contentMarkdown: string;
}

export interface PushRetrospectiveResult {
  commitSha: string;
  htmlUrl: string;
  path: string;
}

/** 회고 마크다운을 push target 저장소에 commit/push. */
export async function apiPushRetrospective(
  payload: PushRetrospectivePayload,
): Promise<PushRetrospectiveResult> {
  const res = await request<components["schemas"]["PushResultResponse"]>(
    "/github/retrospectives/push",
    { method: "POST", body: payload },
  );
  return {
    commitSha: res.commitSha,
    htmlUrl: res.htmlUrl,
    path: res.path,
  };
}
