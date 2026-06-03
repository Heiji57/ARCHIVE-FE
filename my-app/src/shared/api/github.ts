/**
 * GitHub 저장소 연동 API (api.yaml github 태그).
 * 연결(인증)은 GitHub OAuth 로그인 토큰 재사용 — 별도 연결 엔드포인트 없음.
 * 응답 스키마가 이미 camelCase 라 매핑은 거의 패스스루.
 */
import type {
  AvailableRepository,
  LinkedRepository,
} from "@/entities/github/model/types";
import { request } from "./client";
import type { components } from "./schema";

type RepositoryResponse = components["schemas"]["RepositoryResponse"];
type AvailableRepositoryResponse =
  components["schemas"]["AvailableRepositoryResponse"];

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
