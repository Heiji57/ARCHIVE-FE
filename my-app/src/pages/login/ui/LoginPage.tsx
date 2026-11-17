import type { AuthRoute } from "@/app/router/authRoute";
import { AuthShell, LoginForm } from "@/widgets/auth";

interface LoginPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function LoginPage({ onAuthNavigate }: LoginPageProps) {
  return (
    <AuthShell>
      <LoginForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
