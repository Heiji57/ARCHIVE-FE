import type { RetroRouteParams } from "@/app/router/navigation";
import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage } from "@/widgets/app-shell";
import { RetrospectiveStudio } from "@/widgets/retrospective-studio";

interface RetrospectivesPageProps {
  retroParams?: RetroRouteParams;
  onRetroNavigate?: (params: RetroRouteParams) => void;
}

export function RetrospectivesPage({ retroParams, onRetroNavigate }: RetrospectivesPageProps) {
  const { t } = useTranslation();
  return (
    <ShellPage toolbar={<h1 className="sh-title">{t("shell.tab.retro")}</h1>}>
      <RetrospectiveStudio retroParams={retroParams} onRetroNavigate={onRetroNavigate} />
    </ShellPage>
  );
}
