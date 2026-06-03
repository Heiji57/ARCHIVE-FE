/**
 * Mock 인증 로직. 백엔드가 없는 상태에서 회원가입/로그인 UI를 검증하기 위한 임시 구현.
 *
 * 동작 방식:
 * - 이메일 인증 코드는 메모리에 저장하고 콘솔에 출력합니다 (실제 메일 전송 없음).
 * - OAuth는 1초 대기 후 가짜 프로필을 반환합니다.
 * - 등록된 유저는 authStorage.ts 를 통해 localStorage 에 저장됩니다.
 *
 * 백엔드 도입 시 이 파일은 폐기되고 모든 호출은 API로 교체됩니다.
 */
import {
  findUserByEmail,
  findUserByOAuth,
  hashPassword,
  saveUser,
  updatePassword,
} from "@/app/lib/authStorage";
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
import { createId } from "@/shared/lib/id";

/** mock 타임존: 서버 계산 대신 브라우저 tz 사용 (USE_API=false 전용). */
function mockTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// ─── 이메일 인증 코드 관리 (메모리) ─────────────────────────────────────────

interface PendingCode {
  code: string;
  /** 인증 코드 만료 시각 (5분 후). */
  expiresAt: number;
  /** 마지막 발송 시각 (재전송 쿨다운용). */
  lastSentAt: number;
  /** 인증 완료 여부 — verify 후 true 가 되며 signup/reset 호출 시 검사. */
  verified: boolean;
}

const pendingCodes = new Map<string, PendingCode>();

const CODE_TTL_MS = 5 * 60 * 1000; // 5분
const RESEND_COOLDOWN_MS = 60 * 1000; // 60초

function generate6DigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function mockRequestEmailCode(
  email: string,
  opts: { mode?: "signup" | "reset" } = {},
): Promise<RequestCodeResult> {
  const normalizedEmail = email.toLowerCase();
  const mode = opts.mode ?? "signup";

  if (mode === "signup") {
    // 가입 흐름: 이미 등록된 이메일이면 거부
    const existing = findUserByEmail(normalizedEmail);
    if (existing) {
      return { ok: false, error: "already-registered" };
    }
  } else {
    // 비밀번호 찾기 흐름: 가입되지 않은 이메일이면 거부
    const existing = findUserByEmail(normalizedEmail);
    if (!existing) {
      // 보안상 같은 에러 코드로 응답 (계정 존재 여부 노출 방지) — 데모에선 그냥 통과
      // 실제 서비스에서는 "코드를 보냈습니다"로 일관 응답 후 내부적으로만 차단
      return { ok: false, error: "already-registered" };
    }
  }

  // 재전송 쿨다운 체크
  const pending = pendingCodes.get(normalizedEmail);
  const now = Date.now();
  if (pending && now - pending.lastSentAt < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "cooldown" };
  }

  const code = generate6DigitCode();
  pendingCodes.set(normalizedEmail, {
    code,
    expiresAt: now + CODE_TTL_MS,
    lastSentAt: now,
    verified: false,
  });

  // Mock — 콘솔에 출력.
  // eslint-disable-next-line no-console
  console.log(
    `%c[ARCHIVE Mock Email] %c${normalizedEmail} 인증 코드: %c${code}`,
    "color: #888",
    "color: #888",
    "color: #4ade80; font-size: 16px; font-weight: bold;",
  );

  // 가짜 네트워크 지연
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true };
}

export async function mockVerifyEmailCode(
  email: string,
  code: string,
): Promise<VerifyCodeResult> {
  await new Promise((r) => setTimeout(r, 200));
  const normalizedEmail = email.toLowerCase();
  const pending = pendingCodes.get(normalizedEmail);

  if (!pending) return { ok: false, error: "not-requested" };
  if (Date.now() > pending.expiresAt) {
    pendingCodes.delete(normalizedEmail);
    return { ok: false, error: "expired" };
  }
  if (pending.code !== code.trim()) {
    return { ok: false, error: "invalid-code" };
  }

  pending.verified = true;
  pendingCodes.set(normalizedEmail, pending);
  return { ok: true };
}

export function isEmailVerified(email: string): boolean {
  return pendingCodes.get(email.toLowerCase())?.verified === true;
}

export function clearVerification(email: string) {
  pendingCodes.delete(email.toLowerCase());
}

// ─── 회원가입 / 로그인 / OAuth ──────────────────────────────────────────────

export async function mockCompleteSignup(
  input: SignupInput,
): Promise<SignupResult> {
  await new Promise((r) => setTimeout(r, 400));
  const normalizedEmail = input.email.toLowerCase();

  if (!isEmailVerified(normalizedEmail)) {
    return { ok: false, error: "email-not-verified" };
  }
  if (findUserByEmail(normalizedEmail)) {
    return { ok: false, error: "already-registered" };
  }

  const user: User = {
    id: createId("user"),
    email: normalizedEmail,
    country: input.country,
    region: input.region,
    timezone: mockTimezone(),
    displayName: input.displayName,
    oauthProvider: null,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };

  saveUser({ user, passwordHash: hashPassword(input.password) });
  clearVerification(normalizedEmail);
  return { ok: true, user };
}

export async function mockLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  await new Promise((r) => setTimeout(r, 400));
  const record = findUserByEmail(email);
  if (!record) return { ok: false, error: "user-not-found" };
  if (record.passwordHash !== hashPassword(password)) {
    return { ok: false, error: "invalid-credentials" };
  }
  return { ok: true, user: record.user };
}

const OAUTH_MOCK_PROFILES: Record<
  OAuthProvider,
  { id: string; displayName: string; email: string }
> = {
  github: {
    id: "github_12345",
    displayName: "GitHub Demo User",
    email: "demo@github.archive",
  },
  google: {
    id: "google_67890",
    displayName: "Google Demo User",
    email: "demo@google.archive",
  },
};

/** 온보딩 대기 중인 mock OAuth 프로필 (신규 사용자 국가 입력 전까지 보관). */
let pendingOnboarding: {
  provider: OAuthProvider;
  id: string;
  email: string;
  displayName: string;
} | null = null;

export async function mockOAuthLogin(
  provider: OAuthProvider,
): Promise<OAuthResult> {
  // OAuth 리다이렉트 + 토큰 교환을 1초 대기로 시뮬레이션
  await new Promise((r) => setTimeout(r, 1000));

  const profile = OAUTH_MOCK_PROFILES[provider];

  // 이미 가입돼있으면 그 유저로 로그인
  const existing = findUserByOAuth(provider, profile.id);
  if (existing) return { kind: "success", user: existing.user };

  // 신규: 온보딩 필요 (국가 입력) — 프로필을 잠시 보관
  pendingOnboarding = { provider, ...profile };
  return { kind: "onboarding-required" };
}

export async function mockCompleteOnboarding(input: {
  country: string;
  region: string | null;
}): Promise<SignupResult> {
  await new Promise((r) => setTimeout(r, 400));
  if (!pendingOnboarding) {
    return { ok: false, error: "email-not-verified" };
  }
  const p = pendingOnboarding;
  const existing = findUserByOAuth(p.provider, p.id);
  if (existing) {
    pendingOnboarding = null;
    return { ok: true, user: existing.user };
  }
  const user: User = {
    id: `user_${p.provider}_${p.id}`,
    email: p.email,
    country: input.country,
    region: input.region,
    timezone: mockTimezone(),
    displayName: p.displayName,
    oauthProvider: p.provider,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
  saveUser({ user, passwordHash: null });
  pendingOnboarding = null;
  return { ok: true, user };
}

export async function mockResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  await new Promise((r) => setTimeout(r, 300));

  const normalizedEmail = email.toLowerCase();
  const pending = pendingCodes.get(normalizedEmail);
  if (!pending || pending.code !== code.trim() || !pending.verified) {
    return { ok: false, error: "invalid-code" };
  }

  if (!updatePassword(normalizedEmail, newPassword)) {
    return { ok: false, error: "user-not-found" };
  }

  clearVerification(normalizedEmail);
  return { ok: true };
}
