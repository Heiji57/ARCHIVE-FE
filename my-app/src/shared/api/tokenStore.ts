/**
 * Access token 은 메모리에만 보관한다 (localStorage 저장 X → XSS 노출 최소화).
 * 새로고침 시 사라지므로, 앱 시작 시 refresh 쿠키로 silent refresh 하여 복원한다.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
