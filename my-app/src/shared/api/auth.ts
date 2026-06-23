/**
 * Auth 도메인 API 클라이언트.
 * 반환 타입은 기존 mock 과 동일한 Result 계약(LoginResult 등)을 따라 AppProvider 에서 깔끔히 교체된다.
 *
 * api.yaml 에 없는 기능(비밀번호 재설정/forgot-password)은 여기서 제공하지 않으며,
 * AppProvider 가 해당 흐름을 mock 으로 폴백한다. (CLAUDE.md §8 알려진 간극)
 */
import type {
  LoginResult,
  OAuthResult,
  RequestCodeResult,
  ResetPasswordResult,
  SignupInput,
  SignupResult,
  VerifyCodeResult,
} from "@/app/model/types";
import type { OAuthProvider, User } from "@/entities/user/model/types";
import { API_BASE_URL } from "./config";
import { refreshAccessToken, request } from "./client";
import { ApiError } from "./errors";
import { toUser } from "./mappers";
import type { components } from "./schema";
import { setAccessToken } from "./tokenStore";

type TokenResponse = components["schemas"]["TokenResponse"];
type UserResponse = components["schemas"]["UserResponse"];
type UpdateProfileResponse = components["schemas"]["UpdateProfileResponse"];

async function fetchMe(opts?: {
  displayName?: string | null;
  oauthProvider?: OAuthProvider | null;
}): Promise<User> {
  const me = await request<UserResponse>("/auth/me");
  return toUser(me, opts);
}

// ─── 이메일 인증 (회원가입 흐름) ──────────────────────────────────────────────

export async function apiRequestEmailCode(
  email: string,
): Promise<RequestCodeResult> {
  try {
    await request("/auth/email/verify/send", {
      method: "POST",
      auth: false,
      body: { email },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 429) {
      return { ok: false, error: "cooldown" };
    }
    return { ok: false, error: "cooldown" };
  }
}

export async function apiVerifyEmailCode(
  email: string,
  code: string,
): Promise<VerifyCodeResult> {
  try {
    await request("/auth/email/verify/confirm", {
      method: "POST",
      auth: false,
      body: { email, code: code.trim() },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "invalid-code" };
  }
}

// ─── 회원가입 / 로그인 ────────────────────────────────────────────────────────

export async function apiCompleteSignup(
  input: SignupInput,
): Promise<SignupResult> {
  try {
    const token = await request<TokenResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: {
        email: input.email,
        password: input.password,
        passwordConfirm: input.password,
        country: input.country,
        region: input.region,
      },
    });
    setAccessToken(token.accessToken);
    // displayName 은 클라 전용 보존 (API 미저장)
    const user = await fetchMe({ displayName: input.displayName });
    return { ok: true, user };
  } catch (e) {
    if (e instanceof ApiError && e.code === "USER_EMAIL_DUPLICATED") {
      return { ok: false, error: "already-registered" };
    }
    return { ok: false, error: "email-not-verified" };
  }
}

/** OAuth 신규 사용자 온보딩 완료 (onboarding_token 쿠키 사용). */
export async function apiCompleteOnboarding(input: {
  country: string;
  region: string | null;
  displayName?: string;
}): Promise<SignupResult> {
  try {
    const token = await request<TokenResponse>("/auth/oauth/onboarding", {
      method: "POST",
      auth: false, // onboarding_token 쿠키로 인증 (credentials:"include")
      body: { country: input.country, region: input.region },
    });
    setAccessToken(token.accessToken);
    const user = await fetchMe({ displayName: input.displayName });
    return { ok: true, user };
  } catch (e) {
    if (e instanceof ApiError && e.code === "USER_EMAIL_DUPLICATED") {
      return { ok: false, error: "already-registered" };
    }
    return { ok: false, error: "email-not-verified" };
  }
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const token = await request<TokenResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setAccessToken(token.accessToken);
    const user = await fetchMe();
    return { ok: true, user };
  } catch {
    // API 는 보안상 자격증명 오류를 구분하지 않음 → invalid-credentials 로 통일
    return { ok: false, error: "invalid-credentials" };
  }
}

// ─── 비밀번호 재설정 (이메일 토큰 링크 방식) ──────────────────────────────────

/**
 * 비밀번호 재설정 메일 발송 요청.
 * 보안상 가입 여부와 무관하게 항상 성공 응답이므로 FE 도 항상 ok 로 처리한다.
 */
export async function apiRequestPasswordReset(email: string): Promise<void> {
  try {
    await request("/auth/password/reset/request", {
      method: "POST",
      auth: false,
      body: { email },
    });
  } catch {
    // enumeration 방지 — 실패해도 사용자에게 동일 안내
  }
}

/** 이메일로 받은 토큰 + 새 비밀번호로 재설정 확정. */
export async function apiConfirmPasswordReset(
  token: string,
  newPassword: string,
  newPasswordConfirm: string,
): Promise<ResetPasswordResult> {
  try {
    await request("/auth/password/reset/confirm", {
      method: "POST",
      auth: false,
      body: { token, newPassword, newPasswordConfirm },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      switch (e.code) {
        case "AUTH_PASSWORD_RESET_TOKEN_INVALID":
          return { ok: false, error: "token-invalid" };
        case "AUTH_PASSWORD_RESET_TOKEN_EXPIRED":
          return { ok: false, error: "token-expired" };
        case "AUTH_PASSWORD_RESET_NOT_ALLOWED":
          return { ok: false, error: "not-allowed" };
      }
    }
    return { ok: false, error: "unknown" };
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST", retryOn401: false });
  } catch {
    // 로그아웃 실패해도 클라 토큰은 비운다
  } finally {
    setAccessToken(null);
  }
}

export async function apiUpdateProfile(
  patch: Partial<Pick<User, "displayName" | "avatarUrl" | "accountType">>,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.displayName !== undefined) body.display_name = patch.displayName;
  if (patch.accountType !== undefined) body.accountType = patch.accountType;
  if (Object.keys(body).length === 0) return;
  // 에러는 호출 측(profileQueue.onError / setAccountType)에서 토스트로 표면화한다.
  // 여기서 삼키면 DB 미반영을 진단할 수 없다.
  const res = await request<UpdateProfileResponse>("/auth/me", {
    method: "PATCH",
    body,
  });
  // accountType 변경 시 서버가 새 access token 을 발급한다(JWT 의 accountType
  // 클레임 갱신). non-null 이면 즉시 교체해야 이후 요청이 새 권한으로 인가된다.
  if (res?.accessToken) setAccessToken(res.accessToken);
}

/** 앱 시작 시 refresh 쿠키로 세션 복원. 성공하면 User, 실패하면 null. */
export async function apiRestoreSession(): Promise<User | null> {
  const ok = await refreshAccessToken();
  if (!ok) return null;
  try {
    return await fetchMe();
  } catch {
    return null;
  }
}

// ─── OAuth (팝업 + postMessage) ──────────────────────────────────────────────

interface OAuthMessage {
  type: "oauth_success" | "oauth_onboarding_required" | "oauth_error";
  access_token?: string;
  error?: string;
}

export function apiOAuthLogin(provider: OAuthProvider): Promise<OAuthResult> {
  return new Promise((resolve) => {
    const popup = window.open(
      `${API_BASE_URL}/auth/oauth/${provider}/authorize`,
      "oauth",
      "width=520,height=640",
    );
    if (!popup) {
      resolve({ kind: "error", error: "popup-blocked" });
      return;
    }

    let settled = false;
    const finish = (result: OAuthResult) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(closedTimer);
      resolve(result);
    };

    const onMessage = async (event: MessageEvent) => {
      const data = event.data as OAuthMessage | undefined;
      const looksOAuth =
        !!data &&
        typeof data === "object" &&
        (data.type === "oauth_success" ||
          data.type === "oauth_onboarding_required" ||
          data.type === "oauth_error");
      // 같은 origin(프록시) 에서 온 메시지만 신뢰
      if (event.origin !== window.location.origin) {
        if (looksOAuth) {
          console.warn(
            `[oauth-login] OAuth 메시지를 예상치 못한 origin(${event.origin})에서 수신해 무시함. ` +
              `기대 origin=${window.location.origin}. redirect_uri 설정을 확인하세요.`,
            data,
          );
        }
        return;
      }
      if (!looksOAuth) return;

      if (data.type === "oauth_success" && data.access_token) {
        setAccessToken(data.access_token);
        try {
          const user = await fetchMe({ oauthProvider: provider });
          finish({ kind: "success", user });
        } catch {
          finish({ kind: "error", error: "fetch-me-failed" });
        }
      } else if (data.type === "oauth_onboarding_required") {
        // onboarding_token 쿠키가 설정됨 → 국가 입력 단계로
        finish({ kind: "onboarding-required" });
      } else {
        finish({ kind: "error", error: data.error ?? "oauth-failed" });
      }
    };

    window.addEventListener("message", onMessage);

    // 팝업이 닫혔는데 oauth_success 메시지를 못 받았을 수 있다(전달 누락/타이밍).
    // 콜백이 refresh 쿠키를 이미 설정했다면 세션 복원으로 자동 로그인 처리한다
    // → 사용자가 새로고침하지 않아도 바로 서비스 화면으로 진입.
    let recovering = false;
    const closedTimer = window.setInterval(() => {
      if (recovering || !popup.closed) return;
      recovering = true;
      void (async () => {
        const restored = await apiRestoreSession();
        if (restored) finish({ kind: "success", user: restored });
        else finish({ kind: "error", error: "popup-closed" });
      })();
    }, 500);
  });
}

// ─── OAuth 계정 연결 (로그인 상태에서 provider 추가 연결) ──────────────────────

interface OAuthLinkMessage {
  type: "oauth_linked" | "oauth_error";
  provider?: string;
  error?: string;
}

/**
 * 이미 로그인된 사용자가 provider 계정을 연결한다 (POST init 패턴).
 *
 * 1. POST /auth/oauth/{provider}/link/init (Bearer) → { authorizeUrl }
 *    인증된 컨텍스트에서 state(link_user_id 바인딩)를 사전 발급받는다.
 * 2. 반환된 authorizeUrl 을 팝업으로 직접 연다 (provider 동의 화면).
 * 3. provider → 백엔드 callback → oauth_linked postMessage 로 결과 통지.
 *
 * (구 GET link/authorize 는 팝업 GET 이라 Bearer 헤더를 못 실어 폐기됨)
 */
export async function apiLinkOAuth(
  provider: OAuthProvider,
): Promise<{ ok: boolean; error?: string }> {
  // 1단계: 인증된 POST 로 authorize URL 발급
  let authorizeUrl: string;
  try {
    const init = await request<
      components["schemas"]["OAuthLinkInitResponse"]
    >(`/auth/oauth/${provider}/link/init`, { method: "POST" });
    authorizeUrl = init.authorizeUrl;
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === "AUTH_OAUTH_ACCOUNT_ALREADY_LINKED")
        return { ok: false, error: "account-already-linked" };
      if (e.code === "AUTH_OAUTH_PROVIDER_ALREADY_LINKED")
        return { ok: false, error: "provider-already-linked" };
    }
    return { ok: false, error: "init-failed" };
  }

  // 2단계: 팝업으로 provider 동의 화면 열기 + postMessage 수신
  return new Promise((resolve) => {
    const popup = window.open(authorizeUrl, "oauth-link", "width=600,height=700");
    if (!popup) {
      resolve({ ok: false, error: "popup-blocked" });
      return;
    }

    let settled = false;
    const finish = (result: { ok: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(closedTimer);
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as OAuthLinkMessage | undefined;
      const looksOAuth =
        !!data &&
        typeof data === "object" &&
        (data.type === "oauth_linked" || data.type === "oauth_error");
      // 보안: 같은 origin(프록시) 에서 온 메시지만 신뢰.
      if (event.origin !== window.location.origin) {
        // OAuth 콜백처럼 보이는데 origin 이 다르면 redirect_uri 설정 문제 → 진단 로그.
        if (looksOAuth) {
          console.warn(
            `[oauth-link] OAuth 메시지를 예상치 못한 origin(${event.origin})에서 수신해 무시함. ` +
              `기대 origin=${window.location.origin}. GitHub redirect_uri 가 ` +
              `FE 프록시 origin(/api/v1/auth/oauth/github/callback)과 일치하는지 확인하세요.`,
            data,
          );
        }
        return;
      }
      if (!looksOAuth) return;
      console.info("[oauth-link] 콜백 메시지 수신:", data);
      if (data.type === "oauth_linked") {
        finish({ ok: true });
      } else {
        finish({ ok: false, error: data.error ?? "oauth-failed" });
      }
    };

    window.addEventListener("message", onMessage);
    const closedTimer = window.setInterval(() => {
      if (popup.closed) finish({ ok: false, error: "popup-closed" });
    }, 500);
  });
}
