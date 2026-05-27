/**
 * Mock "유저 DB" — 브라우저 localStorage에 등록된 유저 정보를 저장합니다.
 * 실제 백엔드 도입 시 이 파일은 폐기되고 모든 호출은 API로 교체됩니다.
 */
import type { OAuthProvider, User } from "@/entities/user/model/types";

const REGISTERED_USERS_KEY = "archive-registered-users-v1";

export interface RegisteredUserRecord {
  user: User;
  /** "해시"라고 부르지만 데모용으로 단순 base64 인코딩만 적용합니다. */
  passwordHash: string | null;
}

type RegisteredUsersMap = Record<string, RegisteredUserRecord>;

function readMap(): RegisteredUsersMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUsersMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: RegisteredUsersMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(map));
}

export function hashPassword(plain: string): string {
  // 데모용 — 실서비스에서는 절대 사용하지 마세요. 서버에서 bcrypt/argon2 사용.
  return btoa(unescape(encodeURIComponent(`archive::${plain}`)));
}

export function findUserByEmail(email: string): RegisteredUserRecord | null {
  const map = readMap();
  return map[email.toLowerCase()] ?? null;
}

export function findUserByOAuth(
  provider: OAuthProvider,
  providerUserId: string,
): RegisteredUserRecord | null {
  const map = readMap();
  return (
    Object.values(map).find(
      (r) =>
        r.user.oauthProvider === provider &&
        r.user.id === `user_${provider}_${providerUserId}`,
    ) ?? null
  );
}

export function saveUser(record: RegisteredUserRecord) {
  const map = readMap();
  map[record.user.email.toLowerCase()] = record;
  writeMap(map);
}

export function updatePassword(email: string, newPassword: string): boolean {
  const map = readMap();
  const key = email.toLowerCase();
  const existing = map[key];
  if (!existing) return false;
  map[key] = { ...existing, passwordHash: hashPassword(newPassword) };
  writeMap(map);
  return true;
}
