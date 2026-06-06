import { useMemo } from "react";
import type { AuthRoute } from "@/app/router/authRoute";
import { useTranslation } from "@/shared/lib/i18n";
import { AuthShell, ResetPasswordForm } from "@/widgets/auth";

interface ResetPasswordPageProps {
  onAuthNavigate: (route: AuthRoute) => void;
}

export function ResetPasswordPage({ onAuthNavigate }: ResetPasswordPageProps) {
  const { t } = useTranslation();
  // 이메일 링크의 ?token= 값을 URL 에서 읽는다.
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get("token"),
    [],
  );

  return (
    <AuthShell
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.subtitle")}
    >
      <ResetPasswordForm token={token} onAuthNavigate={onAuthNavigate} />
    </AuthShell>
  );
}
