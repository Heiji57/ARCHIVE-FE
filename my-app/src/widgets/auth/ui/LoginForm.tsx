import { useState, type FormEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import { USE_API } from "@/shared/api";
import { useTranslation } from "@/shared/lib/i18n";
import { Checkbox, PasswordField, TextField } from "@/shared/ui";
import { OAuthButtons } from "./OAuthButtons";

interface LoginFormProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function LoginForm({ onAuthNavigate }: LoginFormProps) {
  const { t } = useTranslation();
  const { login } = useArchiveApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);
      if (!result.ok) {
        setError(
          result.error === "user-not-found"
            ? t("auth.login.error.userNotFound")
            : t("auth.login.error.invalidCredentials"),
        );
      }
    } catch {
      setError(t("auth.error.unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <TextField
          type="email"
          autoComplete="email"
          label={t("auth.login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          autoComplete="current-password"
          label={t("auth.login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
          required
        />
        <div className="auth-row-between">
          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label={t("auth.login.rememberMe")}
          />
          <button
            type="button"
            className="auth-link"
            onClick={() => onAuthNavigate("forgot-password")}
          >
            {t("auth.login.forgotPassword")}
          </button>
        </div>
        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>

      <div className="auth-divider">{t("auth.divider.or")}</div>
      <OAuthButtons onAuthNavigate={onAuthNavigate} />

      <p className="auth-footer">
        {t("auth.login.noAccount")}
        <button
          type="button"
          className="auth-link"
          onClick={() => onAuthNavigate("signup")}
        >
          {t("auth.login.signupLink")}
        </button>
      </p>

      {/* mock 모드에서만: API 모드는 실제 인증이므로 콘솔 안내가 부적절 */}
      {!USE_API ? (
        <p className="auth-console-hint">{t("auth.consoleHint")}</p>
      ) : null}
    </>
  );
}
