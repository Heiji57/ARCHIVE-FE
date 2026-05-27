export type OAuthProvider = "github" | "google";

export interface User {
  id: string;
  email: string;
  displayName: string;
  oauthProvider: OAuthProvider | null;
  avatarUrl: string | null;
  createdAt: string;
}
