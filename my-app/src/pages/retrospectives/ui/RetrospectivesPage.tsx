import type { RetroRouteParams } from "@/app/router/navigation";
import { RetrospectiveStudio } from "@/widgets/retrospective-studio";

interface RetrospectivesPageProps {
  retroParams?: RetroRouteParams;
  onRetroNavigate?: (params: RetroRouteParams) => void;
}

export function RetrospectivesPage({ retroParams, onRetroNavigate }: RetrospectivesPageProps) {
  return <RetrospectiveStudio retroParams={retroParams} onRetroNavigate={onRetroNavigate} />;
}
