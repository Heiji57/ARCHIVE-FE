import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { AuthShell, SignupForm } from "@/widgets/auth";

interface SignupPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function SignupPage({ onAuthNavigate }: SignupPageProps) {
  const { t } = useTranslation();
  return (
    <AuthShell title={t("auth.signup.title")} subtitle={t("auth.signup.subtitle")}>
      <SignupForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
