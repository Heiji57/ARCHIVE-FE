/**
 * API(snake_case) ↔ FE 도메인(camelCase) 변환 경계.
 * 이 파일에서만 변환하고 FE 내부는 기존 camelCase 타입을 그대로 쓴다.
 */
import type { OAuthProvider, User } from "@/entities/user/model/types";
import type { components } from "./schema";

type UserResponse = components["schemas"]["UserResponse"];

/**
 * API UserResponse({id,email})를 FE User 로 변환.
 * displayName/avatarUrl/oauthProvider/createdAt 는 API 계약에 없으므로
 * 클라 전용 값으로 보존하거나 fallback 한다 (displayName 없으면 email local-part).
 */
export function toUser(
  api: UserResponse,
  opts: { displayName?: string | null; oauthProvider?: OAuthProvider | null } = {},
): User {
  const fallbackName = api.email.split("@")[0] ?? api.email;
  return {
    id: api.id,
    email: api.email,
    displayName: opts.displayName?.trim() || fallbackName,
    oauthProvider: opts.oauthProvider ?? null,
    avatarUrl: null,
    // API 에 createdAt 이 없어 표시용 placeholder. 백엔드 확장 시 교체.
    createdAt: new Date().toISOString(),
  };
}
