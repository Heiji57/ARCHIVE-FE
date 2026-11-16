import { useState, type FormEvent } from "react";
import type { RequestCodeResult } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import { USE_API } from "@/shared/api";
import { isMultiTzCountry } from "@/shared/lib/geo";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { PasswordField, TextField } from "@/shared/ui";
import { CODE_LENGTH } from "../model/code";
import { useEmailVerification } from "../model/useEmailVerification";
import { AuthAlert, AuthHeading, AuthSteps, AuthSwitch } from "./AuthParts";
import { CodeBoxes } from "./CodeBoxes";
import { CountryRegionFields } from "./CountryRegionFields";
import { OAuthButtons } from "./OAuthButtons";

type Step = "email" | "verify" | "profile";

const REQUEST_CODE_ERROR_KEY: Record<
  Extract<RequestCodeResult, { ok: false }>["error"],
  TranslationKey
> = {
  "already-registered": "auth.signup.error.alreadyRegistered",
  cooldown: "auth.signup.error.cooldown",
  "delivery-failed": "auth.signup.error.deliveryFailed",
  unavailable: "auth.signup.error.unavailable",
};

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
  // 시도 횟수 초과/만료 → 새 코드를 받기 전까지 코드 입력을 잠근다.
  const [codeLocked, setCodeLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState<string | null>(null);
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
        setError(t(REQUEST_CODE_ERROR_KEY[result.error]));
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
        switch (result.error) {
          case "expired":
          case "not-requested":
          case "attempts-exceeded":
            // 기존 코드는 더 이상 쓸 수 없음 → 입력을 비우고 잠근 뒤 재전송을 바로 허용
            setError(
              t(
                result.error === "attempts-exceeded"
                  ? "auth.signup.error.attemptsExceeded"
                  : "auth.signup.error.expired",
              ),
            );
            setCode("");
            setCodeLocked(true);
            resetCooldown();
            break;
          case "unavailable":
            setError(t("auth.signup.error.unavailable"));
            break;
          default:
            setError(t("auth.signup.error.invalidCode"));
        }
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
        setError(t(REQUEST_CODE_ERROR_KEY[result.error]));
        // 서버 쿨다운 중이면 재전송 버튼을 타이머로 잠근다
        if (result.error === "cooldown") startCooldown();
        return;
      }
      setCode("");
      setCodeLocked(false);
      startCooldown();
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 3: 프로필 ───────────────────────────────────────────────────────
  const regionMissing = isMultiTzCountry(country) && !region;
  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) return;
    if (password !== passwordConfirm) {
      setError(t("auth.signup.passwordMismatch"));
      return;
    }
    if (!country) {
      setError(t("auth.signup.error.countryRequired"));
      return;
    }
    if (regionMissing) {
      setError(t("auth.signup.error.regionRequired"));
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
        country,
        region,
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

  const goBackToEmail = () => {
    setError(null);
    setCode("");
    setCodeLocked(false);
    setStep("email");
  };

  const stepNo = step === "email" ? 1 : step === "verify" ? 2 : 3;
  const title =
    step === "email"
      ? t("auth.signup.title")
      : step === "verify"
        ? t("auth.verify.title")
        : t("auth.onboarding.title");

  return (
    <>
      <AuthHeading title={title} />
      <AuthSteps current={stepNo} />

      {step === "email" ? (
        <>
          <form className="auth-form" onSubmit={(e) => void submitEmail(e)}>
            {error ? <AuthAlert>{error}</AuthAlert> : null}
            <TextField
              type="email"
              autoComplete="email"
              label={t("auth.signup.email")}
              placeholder={t("auth.field.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              autoFocus
              required
            />
            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? t("auth.signup.emailSending") : t("auth.signup.emailNext")}
            </button>
          </form>
          <OAuthButtons onAuthNavigate={onAuthNavigate} />
        </>
      ) : null}

      {step === "verify" ? (
        <form className="auth-form" onSubmit={(e) => void submitCode(e)}>
          <p className="auth-lead">{t("auth.verify.lead", { email })}</p>
          {error ? <AuthAlert>{error}</AuthAlert> : null}
          <CodeBoxes value={code} onChange={setCode} disabled={codeLocked} autoFocus />
          <button
            type="submit"
            className="auth-submit"
            disabled={submitting || codeLocked || code.length !== CODE_LENGTH}
          >
            {submitting ? t("auth.login.submitting") : t("auth.signup.codeVerify")}
          </button>
          <div className="auth-row">
            <button type="button" className="auth-link" onClick={goBackToEmail}>
              {t("auth.signup.back")}
            </button>
            {cooldownLeft > 0 ? (
              <span className="auth-muted" aria-live="polite">
                {t("auth.signup.codeResendIn", { n: cooldownLeft })}
              </span>
            ) : (
              <button
                type="button"
                className="auth-link"
                onClick={() => void resendCode()}
                disabled={submitting}
              >
                {t("auth.signup.codeResend")}
              </button>
            )}
          </div>
          {/* mock 모드에서만: 코드를 콘솔에서 확인하라는 안내. API 모드는 메일 발송 */}
          {!USE_API ? <p className="auth-note">{t("auth.consoleHint")}</p> : null}
        </form>
      ) : null}

      {step === "profile" ? (
        <form className="auth-form" onSubmit={(e) => void submitProfile(e)}>
          {error && !(passwordConfirm && password !== passwordConfirm) ? <AuthAlert>{error}</AuthAlert> : null}
          <TextField
            type="text"
            label={t("auth.signup.displayName")}
            placeholder={t("auth.signup.displayNamePlaceholder")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            required
          />
          <PasswordField
            autoComplete="new-password"
            label={t("auth.signup.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={t("auth.signup.passwordHint")}
            required
          />
          <PasswordField
            autoComplete="new-password"
            label={t("auth.signup.passwordConfirm")}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            error={
              passwordConfirm && password !== passwordConfirm
                ? t("auth.signup.passwordMismatch")
                : undefined
            }
            required
          />
          <CountryRegionFields
            country={country}
            region={region}
            onCountryChange={setCountry}
            onRegionChange={setRegion}
          />
          <div className="auth-row">
            <AuthSwitch checked={termsAccepted} onChange={setTermsAccepted} label={t("auth.signup.terms")} />
          </div>
          <div className="auth-row">
            <AuthSwitch checked={rememberMe} onChange={setRememberMe} label={t("auth.login.rememberMe")} />
          </div>
          <button
            type="submit"
            className="auth-submit"
            disabled={
              submitting ||
              !termsAccepted ||
              password.length < 8 ||
              password !== passwordConfirm ||
              displayName.trim().length === 0 ||
              !country ||
              regionMissing
            }
          >
            {submitting ? t("auth.signup.submitting") : t("auth.signup.submit")}
          </button>
        </form>
      ) : null}

      <p className="auth-foot">
        {t("auth.signup.haveAccount")}{" "}
        <button type="button" className="auth-link" onClick={() => onAuthNavigate("login")}>
          {t("auth.signup.loginLink")}
        </button>
      </p>
    </>
  );
}
