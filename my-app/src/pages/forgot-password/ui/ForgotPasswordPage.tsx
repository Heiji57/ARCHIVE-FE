import type { AuthRoute } from "@/app/router/authRoute";
import { AuthShell, ForgotPasswordForm } from "@/widgets/auth";

interface ForgotPasswordPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function ForgotPasswordPage({ onAuthNavigate }: ForgotPasswordPageProps) {
  return (
    <AuthShell>
      <ForgotPasswordForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
