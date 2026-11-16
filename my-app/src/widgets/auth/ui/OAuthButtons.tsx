import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import type { OAuthProvider } from "@/entities/user/model/types";
import { oauthErrorMessageKey } from "@/shared/api";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { AuthAlert } from "./AuthParts";

interface OAuthButtonsProps {
  /** 신규 OAuth 사용자 → 온보딩 페이지로 이동시키기 위한 네비게이터. */
  onAuthNavigate?: (route: AuthRoute) => void;
}

/** "또는" 줄과 Google, GitHub 버튼(시안 순서). */
export function OAuthButtons({ onAuthNavigate }: OAuthButtonsProps = {}) {
  const { oauthLogin } = useArchiveApp();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState<OAuthProvider | null>(null);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const click = async (provider: OAuthProvider) => {
    if (processing) return;
    setProcessing(provider);
    setErrorKey(null);
    try {
      const result = await oauthLogin(provider);
      // 성공 → AppProvider 가 로그인 dispatch(AuthGate 가 메인으로 이동)
      // 신규 → 온보딩 페이지로 이동
      // 실패 → 코드별 안내 (사용자가 팝업을 닫은 경우는 표시하지 않음)
      if (result.kind === "onboarding-required") {
        onAuthNavigate?.("onboarding");
      } else if (result.kind === "error") {
        setErrorKey(oauthErrorMessageKey(result.error));
      }
    } finally {
      setProcessing(null);
    }
  };

  const button = (provider: OAuthProvider, label: string, logo: ReactNode) => (
    <button
      type="button"
      className="auth-oauth"
      onClick={() => void click(provider)}
      disabled={Boolean(processing)}
      aria-busy={processing === provider}
    >
      {processing === provider ? <Loader2 size={18} className="auth-spin" aria-hidden="true" /> : logo}
      <span>{processing === provider ? t("auth.oauth.processing") : label}</span>
    </button>
  );

  return (
    <>
      <div className="auth-or">{t("auth.divider.or")}</div>
      {errorKey ? <AuthAlert>{t(errorKey)}</AuthAlert> : null}
      {button("google", t("auth.oauth.google"), <GoogleLogo />)}
      {button("github", t("auth.oauth.github"), <GithubLogo />)}
    </>
  );
}

function GoogleLogo() {
  return (
    <svg className="auth-oauth-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path className="auth-g-b" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path className="auth-g-g" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path className="auth-g-y" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path className="auth-g-r" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GithubLogo() {
  return (
    <svg className="auth-oauth-logo auth-oauth-gh" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
