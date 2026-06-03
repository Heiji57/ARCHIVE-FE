import { useState, type FormEvent } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AuthRoute } from "@/app/router/authRoute";
import { isMultiTzCountry } from "@/shared/lib/geo";
import { useTranslation } from "@/shared/lib/i18n";
import { CountryRegionFields } from "./CountryRegionFields";

interface OnboardingFormProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

/** OAuth 신규 사용자: 국가/지역 입력 후 가입 완료. */
export function OnboardingForm({ onAuthNavigate }: OnboardingFormProps) {
  const { t } = useTranslation();
  const { completeOnboarding } = useArchiveApp();
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const regionMissing = isMultiTzCountry(country) && !region;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!country) {
      setError(t("auth.signup.error.countryRequired"));
      return;
    }
    if (regionMissing) {
      setError(t("auth.signup.error.regionRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await completeOnboarding({ country, region });
      if (!result.ok) {
        // onboarding_token 만료 등 → OAuth 재시도 유도
        setError(t("auth.onboarding.error.expired"));
      }
      // 성공 시 AppProvider 가 로그인 dispatch → AuthGate 가 메인으로 이동
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <p className="auth-onboarding-lead">{t("auth.onboarding.lead")}</p>
        <CountryRegionFields
          country={country}
          region={region}
          onCountryChange={setCountry}
          onRegionChange={setRegion}
          countryError={error ?? undefined}
        />
        <button
          type="submit"
          className="auth-submit"
          disabled={submitting || !country || regionMissing}
        >
          {submitting
            ? t("auth.signup.submitting")
            : t("auth.onboarding.submit")}
        </button>
      </form>

      <p className="auth-footer">
        <button
          type="button"
          className="auth-link"
          onClick={() => onAuthNavigate("login")}
        >
          {t("auth.onboarding.backToLogin")}
        </button>
      </p>
    </>
  );
}
