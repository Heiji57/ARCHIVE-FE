import { useState, type FormEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { PasswordField } from "@/shared/ui";
import { AuthAlert, AuthHeading } from "./AuthParts";

interface ResetPasswordFormProps {
  /** 이메일 링크의 ?token= 값 */
  token: string | null;
  onAuthNavigate: (route: AuthRoute) => void;
}

/** 이메일 링크로 진입 → 새 비밀번호 입력 → confirm → 로그인 이동. */
export function ResetPasswordForm({
  token,
  onAuthNavigate,
}: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const { confirmPasswordReset } = useArchiveApp();

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch =
    newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;
  const canSubmit =
    !!token && newPassword.length >= 8 && newPassword === newPasswordConfirm;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !canSubmit || !token) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await confirmPasswordReset(
        token,
        newPassword,
        newPasswordConfirm,
      );
      if (result.ok) {
        setDone(true);
        return;
      }
      switch (result.error) {
        case "token-expired":
          setError(t("auth.reset.error.tokenExpired"));
          break;
        case "token-invalid":
          setError(t("auth.reset.error.tokenInvalid"));
          break;
        case "not-allowed":
          setError(t("auth.reset.error.notAllowed"));
          break;
        default:
          setError(t("auth.error.unknown"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 토큰이 아예 없으면 잘못된 진입
  if (!token) {
    return (
      <>
        <AuthHeading title={t("auth.reset.title")} />
        <AuthAlert>{t("auth.reset.error.tokenInvalid")}</AuthAlert>
        <button type="button" className="auth-submit" onClick={() => onAuthNavigate("forgot-password")}>
          {t("auth.reset.requestAgain")}
        </button>
      </>
    );
  }

  if (done) {
    return (
      <>
        <AuthHeading title={t("auth.reset.doneTitle")} lead={t("auth.reset.doneLead")} />
        <button type="button" className="auth-submit" onClick={() => onAuthNavigate("login")}>
          {t("auth.reset.goLogin")}
        </button>
      </>
    );
  }

  return (
    <>
      <AuthHeading title={t("auth.reset.title")} lead={t("auth.reset.subtitle")} />
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        {error && !mismatch ? <AuthAlert>{error}</AuthAlert> : null}
        <PasswordField
          autoComplete="new-password"
          label={t("auth.reset.newPassword")}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint={t("auth.signup.passwordHint")}
          autoFocus
          required
        />
        <PasswordField
          autoComplete="new-password"
          label={t("auth.signup.passwordConfirm")}
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          error={mismatch ? t("auth.signup.passwordMismatch") : undefined}
          required
        />
        <button type="submit" className="auth-submit" disabled={!canSubmit || submitting}>
          {submitting ? t("auth.login.submitting") : t("auth.reset.submit")}
        </button>
      </form>

      <p className="auth-foot">
        <button type="button" className="auth-link" onClick={() => onAuthNavigate("login")}>
          {t("auth.forgot.backToLogin")}
        </button>
      </p>
    </>
  );
}
