import type { AuthRoute } from "@/app/router/authRoute";
import { AuthShell, SignupForm } from "@/widgets/auth";

interface SignupPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function SignupPage({ onAuthNavigate }: SignupPageProps) {
  return (
    <AuthShell>
      <SignupForm onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
