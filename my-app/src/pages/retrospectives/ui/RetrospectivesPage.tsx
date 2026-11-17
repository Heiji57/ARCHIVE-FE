import type { RetroRouteParams } from "@/app/router/navigation";
import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage } from "@/widgets/app-shell";
import { RetrospectiveStudio } from "@/widgets/retrospective-studio";
import { TopicStudio } from "@/widgets/topic-studio";

interface RetrospectivesPageProps {
  retroParams?: RetroRouteParams;
  onRetroNavigate?: (params: RetroRouteParams) => void;
}

export function RetrospectivesPage({ retroParams, onRetroNavigate }: RetrospectivesPageProps) {
  const { t } = useTranslation();
  return (
    <ShellPage toolbar={<h1 className="sh-title">{t("shell.tab.retro")}</h1>}>
      {/* 주제 영역(Task 5). 회고 사이드바(회고, 주제, 폴더)와 도구 막대는 Task 4 가 이 자리를 다시 쓸 때 붙인다. */}
      {retroParams?.area === "topic" ? (
        <TopicStudio
          topicId={retroParams.topicId}
          view={retroParams.topicView}
          onNavigate={(p) => onRetroNavigate?.(p)}
        />
      ) : (
        <RetrospectiveStudio retroParams={retroParams} onRetroNavigate={onRetroNavigate} />
      )}
    </ShellPage>
  );
}
