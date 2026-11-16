import type { AuthRoute } from "@/app/router/authRoute";
import { AuthShell, OnboardingForm } from "@/widgets/auth";

interface OnboardingPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function OnboardingPage({ onAuthNavigate }: OnboardingPageProps) {
  return (
    <AuthShell>
      <OnboardingForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
