import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { OAuthProvider } from "@/entities/user/model/types";
import { useTranslation } from "@/shared/lib/i18n";

export function OAuthButtons() {
  const { oauthLogin } = useArchiveApp();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState<OAuthProvider | null>(null);

  const click = async (provider: OAuthProvider) => {
    if (processing) return;
    setProcessing(provider);
    try {
      await oauthLogin(provider);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="auth-oauth-row">
      <button
        type="button"
        className="auth-oauth-btn"
        onClick={() => void click("github")}
        disabled={Boolean(processing)}
      >
        {processing === "github" ? (
          <Loader2 size={16} className="spin" />
        ) : (
          <GithubLogo />
        )}
        <span>
          {processing === "github" ? t("auth.oauth.processing") : t("auth.oauth.github")}
        </span>
      </button>
      <button
        type="button"
        className="auth-oauth-btn"
        onClick={() => void click("google")}
        disabled={Boolean(processing)}
      >
        {processing === "google" ? (
          <Loader2 size={16} className="spin" />
        ) : (
          <GoogleLogo />
        )}
        <span>
          {processing === "google" ? t("auth.oauth.processing") : t("auth.oauth.google")}
        </span>
      </button>
    </div>
  );
}

function GithubLogo() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.97c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.03 1.78 2.71 1.27 3.37.97.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.49.11-3.1 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.61.23 2.8.11 3.1.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.05.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.46-1.7 4.28-5.5 4.28-3.31 0-6.01-2.74-6.01-6.13S8.69 6.12 12 6.12c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.85 3.55 14.62 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.49 0 9.13-3.86 9.13-9.3 0-.62-.07-1.1-.16-1.57H12z"
      />
    </svg>
  );
}
