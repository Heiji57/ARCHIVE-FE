import type { RetroRouteParams } from "@/app/router/navigation";
import { ShellPage } from "@/widgets/app-shell";
import { RetroSidebar, RetroStudioProvider, RetroTopbar, RetrospectiveStudio } from "@/widgets/retrospective-studio";
import { TopicStudio } from "@/widgets/topic-studio";

interface RetrospectivesPageProps {
  retroParams?: RetroRouteParams;
  onRetroNavigate?: (params: RetroRouteParams) => void;
}

/**
 * 회고 탭. 회고 영역과 주제 영역이 같은 사이드바(회고, 주제, 폴더)와 상단 도구 막대를 쓴다.
 * 주제 영역의 본문은 TopicStudio(Task 5), 회고 영역은 RetrospectiveStudio.
 */
export function RetrospectivesPage({ retroParams, onRetroNavigate }: RetrospectivesPageProps) {
  return (
    <RetroStudioProvider params={retroParams} onNavigate={onRetroNavigate}>
      <ShellPage rail={false} sidebar={<RetroSidebar />} toolbar={<RetroTopbar />}>
        {retroParams?.area === "topic" ? (
          <TopicStudio topicId={retroParams.topicId} view={retroParams.topicView} onNavigate={(p) => onRetroNavigate?.(p)} />
        ) : null}
        <RetrospectiveStudio />
      </ShellPage>
    </RetroStudioProvider>
  );
}
