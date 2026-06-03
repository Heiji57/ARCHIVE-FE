import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { AuthShell, OnboardingForm } from "@/widgets/auth";

interface OnboardingPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function OnboardingPage({ onAuthNavigate }: OnboardingPageProps) {
  const { t } = useTranslation();
  return (
    <AuthShell
      title={t("auth.onboarding.title")}
      subtitle={t("auth.onboarding.subtitle")}
    >
      <OnboardingForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
