import type { AccountType } from "@/app/model/settings";

export type OAuthProvider = "github" | "google";

export interface User {
  id: string;
  email: string;
  /** ISO 3166-1 alpha-2 국가 코드 (서버 제공). */
  country: string;
  /** ISO 3166-2 하위지역 코드 — 단일 tz 국가는 null. */
  region: string | null;
  /** IANA timezone (서버가 country/region 으로 계산). 날짜 표시용. */
  timezone: string;
  accountType: AccountType;
  /** 아래 3개는 API 미제공 — 클라 전용(표시·호환용). */
  displayName: string;
  oauthProvider: OAuthProvider | null;
  avatarUrl: string | null;
  createdAt: string;
}
