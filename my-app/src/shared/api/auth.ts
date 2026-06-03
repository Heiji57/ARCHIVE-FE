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
  patch: Partial<Pick<User, "displayName" | "avatarUrl">>,
): Promise<void> {
  // API 는 display_name 만 수용 (응답엔 미포함). best-effort.
  if (patch.displayName === undefined) return;
  try {
    await request("/auth/me", {
      method: "PATCH",
      body: { display_name: patch.displayName },
    });
  } catch {
    // 무시 — 로컬 상태는 AppProvider 가 낙관적으로 유지
  }
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
      // 같은 origin(프록시) 에서 온 메시지만 신뢰
      if (event.origin !== window.location.origin) return;
      const data = event.data as OAuthMessage;
      if (!data || typeof data.type !== "string") return;

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

    // 사용자가 팝업을 닫으면 실패 처리
    const closedTimer = window.setInterval(() => {
      if (popup.closed) finish({ kind: "error", error: "popup-closed" });
    }, 500);
  });
}
