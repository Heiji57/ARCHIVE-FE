import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { AuthShell, ForgotPasswordForm } from "@/widgets/auth";

interface ForgotPasswordPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function ForgotPasswordPage({ onAuthNavigate }: ForgotPasswordPageProps) {
  const { t } = useTranslation();
  return (
    <AuthShell title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")}>
      <ForgotPasswordForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
