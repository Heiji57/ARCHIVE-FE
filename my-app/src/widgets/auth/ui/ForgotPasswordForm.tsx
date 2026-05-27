import { useState, type FormEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { TextField } from "@/shared/ui";
import { useEmailVerification } from "../model/useEmailVerification";

type Step = "email" | "verify" | "new-password" | "done";

interface ForgotPasswordFormProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function ForgotPasswordForm({ onAuthNavigate }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const { requestEmailCode, verifyEmailCode, resetPassword } = useArchiveApp();
  const { cooldownLeft, startCooldown } = useEmailVerification();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      // 'reset' 모드 — 가입된 이메일에만 코드 발송
      const result = await requestEmailCode(email, "reset");
      if (!result.ok) {
        if (result.error === "already-registered") {
          // mockAuth의 'reset' 모드에서는 가입되지 않은 이메일일 때 이 에러 반환
          setError(t("auth.forgot.error.userNotFound"));
        } else {
          setError(t("auth.signup.error.cooldown"));
        }
        return;
      }
      startCooldown();
      setStep("verify");
    } finally {
      setSubmitting(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyEmailCode(email, code);
      if (!result.ok) {
        if (result.error === "expired") setError(t("auth.signup.error.expired"));
        else setError(t("auth.signup.error.invalidCode"));
        return;
      }
      setStep("new-password");
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (newPassword.length < 8 || newPassword !== newPasswordConfirm) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await resetPassword(email, code, newPassword);
      if (!result.ok) {
        setError(t("auth.forgot.error.userNotFound"));
        return;
      }
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {step === "email" ? (
        <form className="auth-form" onSubmit={(e) => void submitEmail(e)}>
          <TextField
            type="email"
            autoComplete="email"
            label={t("auth.login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error ?? undefined}
            required
          />
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? t("auth.signup.emailSending") : t("auth.forgot.emailSubmit")}
          </button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form className="auth-form" onSubmit={(e) => void submitCode(e)}>
          <TextField
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            label={t("auth.signup.code")}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            hint={email}
            error={error ?? undefined}
            autoFocus
            required
          />
          <button type="submit" className="auth-submit" disabled={submitting || code.length !== 6}>
            {submitting ? t("auth.login.submitting") : t("auth.forgot.codeSubmit")}
          </button>
          <p className="auth-console-hint">
            {cooldownLeft > 0
              ? t("auth.signup.codeResendIn", { n: cooldownLeft })
              : t("auth.consoleHint")}
          </p>
        </form>
      ) : null}

      {step === "new-password" ? (
        <form className="auth-form" onSubmit={(e) => void submitNewPassword(e)}>
          <TextField
            type="password"
            autoComplete="new-password"
            label={t("auth.signup.password")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint={t("auth.signup.passwordHint")}
            required
          />
          <TextField
            type="password"
            autoComplete="new-password"
            label={t("auth.signup.passwordConfirm")}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            error={
              newPasswordConfirm && newPassword !== newPasswordConfirm
                ? t("auth.signup.passwordMismatch")
                : error ?? undefined
            }
            required
          />
          <button
            type="submit"
            className="auth-submit"
            disabled={
              submitting ||
              newPassword.length < 8 ||
              newPassword !== newPasswordConfirm
            }
          >
            {submitting ? t("auth.login.submitting") : t("auth.forgot.newPasswordSubmit")}
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="auth-success">{t("auth.forgot.success")}</div>
      ) : null}

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
