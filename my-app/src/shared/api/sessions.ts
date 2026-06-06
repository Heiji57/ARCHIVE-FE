/**
 * 활성 세션 관리 API (api.yaml /auth/sessions).
 * 응답이 이미 camelCase 라 별도 매핑 없이 그대로 사용한다.
 */
import type { Session } from "@/entities/session/model/types";
import { request } from "./client";
import type { components } from "./schema";

type SessionResponse = components["schemas"]["SessionResponse"];

function toSession(api: SessionResponse): Session {
  return {
    sessionId: api.sessionId,
    deviceLabel: api.deviceLabel ?? null,
    deviceInfo: api.deviceInfo ?? null,
    ipPrefix: api.ipPrefix ?? null,
    issuedAt: api.issuedAt,
    lastUsedAt: api.lastUsedAt,
    rotationCounter: api.rotationCounter,
    isCurrent: api.isCurrent,
  };
}

/** 현재 사용자의 활성 세션 목록. */
export async function apiListSessions(): Promise<Session[]> {
  const res = await request<components["schemas"]["SessionListResponse"]>(
    "/auth/sessions",
  );
  return res.sessions.map(toSession);
}

/** 단일 세션 폐기 (본인 소유만, 아니면 404 AUTH_SESSION_NOT_FOUND). */
export async function apiRevokeSession(sessionId: string): Promise<void> {
  await request(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

/** 현재 세션 외 모든 세션 폐기. 폐기된 세션 수 반환. */
export async function apiRevokeOtherSessions(): Promise<number> {
  const res = await request<components["schemas"]["RevokeOthersResponse"]>(
    "/auth/sessions",
    { method: "DELETE" },
  );
  return res.revokedCount;
}
