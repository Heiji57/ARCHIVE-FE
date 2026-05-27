import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { AuthShell, LoginForm } from "@/widgets/auth";

interface LoginPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function LoginPage({ onAuthNavigate }: LoginPageProps) {
  const { t } = useTranslation();
  return (
    <AuthShell title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <LoginForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
