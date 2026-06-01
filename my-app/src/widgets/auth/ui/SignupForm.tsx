import { useState, type FormEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { Checkbox, TextField } from "@/shared/ui";
import { useEmailVerification } from "../model/useEmailVerification";
import { OAuthButtons } from "./OAuthButtons";

type Step = "email" | "verify" | "profile";

interface SignupFormProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function SignupForm({ onAuthNavigate }: SignupFormProps) {
  const { t } = useTranslation();
  const { requestEmailCode, verifyEmailCode, completeSignup } = useArchiveApp();
  const { cooldownLeft, startCooldown, resetCooldown } = useEmailVerification();

  // 랜딩 페이지 이메일 폼에서 ?email= 파라미터로 전달된 값 pre-fill
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(
    () => new URLSearchParams(window.location.search).get("email") ?? "",
  );
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── Step 1: 이메일 입력 ───────────────────────────────────────────────────
  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await requestEmailCode(email);
      if (!result.ok) {
        if (result.error === "already-registered") {
          setError(t("auth.signup.error.alreadyRegistered"));
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

  // ─── Step 2: 인증 코드 ─────────────────────────────────────────────────────
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
      setStep("profile");
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (cooldownLeft > 0 || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await requestEmailCode(email);
      if (!result.ok) {
        setError(t("auth.signup.error.cooldown"));
        return;
      }
      startCooldown();
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 3: 프로필 ───────────────────────────────────────────────────────
  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) return;
    if (password !== passwordConfirm) {
      setError(t("auth.signup.passwordMismatch"));
      return;
    }
    if (!termsAccepted) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await completeSignup({
        email,
        password,
        displayName: displayName.trim(),
        rememberMe,
      });
      if (!result.ok) {
        if (result.error === "already-registered") {
          setError(t("auth.signup.error.alreadyRegistered"));
        } else {
          setError(t("auth.signup.error.notVerified"));
        }
      } else {
        resetCooldown();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <StepProgress step={step} />

      {step === "email" ? (
        <form className="auth-form" onSubmit={(e) => void submitEmail(e)}>
          <TextField
            type="email"
            autoComplete="email"
            label={t("auth.signup.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error ?? undefined}
            required
          />
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? t("auth.signup.emailSending") : t("auth.signup.emailNext")}
          </button>

          <div className="auth-divider">{t("auth.divider.or")}</div>
          <OAuthButtons />
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
            {submitting ? t("auth.login.submitting") : t("auth.signup.codeVerify")}
          </button>
          <button
            type="button"
            className="auth-secondary"
            onClick={() => void resendCode()}
            disabled={cooldownLeft > 0 || submitting}
          >
            {cooldownLeft > 0
              ? t("auth.signup.codeResendIn", { n: cooldownLeft })
              : t("auth.signup.codeResend")}
          </button>
          <p className="auth-console-hint">{t("auth.consoleHint")}</p>
        </form>
      ) : null}

      {step === "profile" ? (
        <form className="auth-form" onSubmit={(e) => void submitProfile(e)}>
          <TextField
            type="text"
            label={t("auth.signup.displayName")}
            placeholder={t("auth.signup.displayNamePlaceholder")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <TextField
            type="password"
            autoComplete="new-password"
            label={t("auth.signup.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={t("auth.signup.passwordHint")}
            required
          />
          <TextField
            type="password"
            autoComplete="new-password"
            label={t("auth.signup.passwordConfirm")}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            error={
              passwordConfirm && password !== passwordConfirm
                ? t("auth.signup.passwordMismatch")
                : error ?? undefined
            }
            required
          />
          <Checkbox
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            label={t("auth.signup.terms")}
          />
          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label={t("auth.login.rememberMe")}
          />
          <button
            type="submit"
            className="auth-submit"
            disabled={
              submitting ||
              !termsAccepted ||
              password.length < 8 ||
              password !== passwordConfirm ||
              displayName.trim().length === 0
            }
          >
            {submitting ? t("auth.signup.submitting") : t("auth.signup.submit")}
          </button>
        </form>
      ) : null}

      <p className="auth-footer">
        {t("auth.signup.haveAccount")}
        <button
          type="button"
          className="auth-link"
          onClick={() => onAuthNavigate("login")}
        >
          {t("auth.signup.loginLink")}
        </button>
      </p>
    </>
  );
}

function StepProgress({ step }: { step: Step }) {
  const { t } = useTranslation();
  const steps: Array<{ id: Step; label: string }> = [
    { id: "email", label: t("auth.signup.step1") },
    { id: "verify", label: t("auth.signup.step2") },
    { id: "profile", label: t("auth.signup.step3") },
  ];
  const currentIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="auth-step-progress" role="list">
      {steps.map((s, idx) => {
        const active = idx === currentIdx;
        const done = idx < currentIdx;
        return (
          <span key={s.id} className="auth-step-row">
            <span
              className="auth-step-dot"
              data-active={active ? "true" : undefined}
              data-done={done ? "true" : undefined}
            />
            <span className="auth-step-label" data-active={active ? "true" : undefined}>
              {s.label}
            </span>
            {idx < steps.length - 1 ? <span className="auth-step-sep">›</span> : null}
          </span>
        );
      })}
    </div>
  );
}
