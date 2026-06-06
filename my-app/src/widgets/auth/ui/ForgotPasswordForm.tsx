import { useState, type FormEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { TextField } from "@/shared/ui";

interface ForgotPasswordFormProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

/**
 * 비밀번호 찾기 — 이메일 입력 → 재설정 링크 발송.
 * 실제 새 비밀번호 입력은 메일 링크(/reset-password?token=)에서 진행한다.
 */
export function ForgotPasswordForm({ onAuthNavigate }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const { requestPasswordReset } = useArchiveApp();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      // 보안상 가입 여부와 무관하게 항상 성공 안내
      await requestPasswordReset(email);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!sent ? (
        <form className="auth-form" onSubmit={(e) => void submitEmail(e)}>
          <TextField
            type="email"
            autoComplete="email"
            label={t("auth.login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? t("auth.signup.emailSending")
              : t("auth.forgot.emailSubmit")}
          </button>
        </form>
      ) : (
        <div className="auth-success">{t("auth.forgot.linkSent")}</div>
      )}

      <p className="auth-footer">
        <button
          type="button"
          className="auth-link"
          onClick={() => onAuthNavigate("login")}
        >
          {t("auth.forgot.backToLogin")}
        </button>
      </p>
    </>
  );
}
