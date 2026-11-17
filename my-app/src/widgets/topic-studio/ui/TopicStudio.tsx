import { useState } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import { useTopicStudioData } from "../model/useTopicStudioData";
import type { TopicRouteParams } from "../model/route";
import { TopicDoc } from "./TopicDoc";
import { TopicList } from "./TopicList";

export interface TopicStudioProps {
  /** 열린 주제(없으면 목록) */
  topicId?: string;
  view?: "doc" | "graph";
  /** 회고 경로로 옮기기(Task 1 의 RetroRouteParams 와 같은 모양) */
  onNavigate: (params: TopicRouteParams) => void;
}

/**
 * 회고 주제 화면(셸 안의 본문 자리). 목록(카드 / 좌우로 넘기기), 본문(문서 / 연결), 정리 전과 정리 중.
 * 사이드바(회고, 주제, 폴더)와 상단 도구 막대는 회고 화면(Task 4)이 그린다.
 */
export function TopicStudio({ topicId, view = "doc", onNavigate }: TopicStudioProps) {
  const { t } = useTranslation();
  const data = useTopicStudioData(topicId ?? null);
  const [fresh, setFresh] = useState<string | null>(null);

  const open = (id: string) => onNavigate({ area: "topic", topicId: id });
  const openEntry = (id: string) => onNavigate({ view: "editor", entryId: id });
  const current = topicId ? data.views.find((v) => v.topic.id === topicId) : undefined;

  const create = () => {
    void data.create(t("topic.v.newName"), "").then((tp) => {
      if (!tp) return;
      setFresh(tp.id);
      open(tp.id);
    });
  };
  // 실제 모드의 넘기기에서 고른 정리하기는 그 주제를 열고 본문에서 정리한다(정리 감시는 열린 주제만 한다).
  const generateFromList = (id: string) => (data.demo ? data.generate(id) : open(id));

  return (
    <div className="tpv">
      {topicId && current ? (
        <TopicDoc
          key={current.topic.id}
          view={current}
          graph={view === "graph"}
          data={data}
          onBack={() => onNavigate({ area: "topic" })}
          onSetView={(v) => onNavigate({ area: "topic", topicId: current.topic.id, ...(v === "graph" ? { topicView: "graph" } : {}) })}
          onGenerate={() => data.generate(current.topic.id)}
          onRename={(name) => data.rename(current.topic.id, name)}
          onDescribe={(d) => data.describe(current.topic.id, d)}
          onOpenEntry={openEntry}
          autoFocusName={fresh === current.topic.id}
        />
      ) : topicId && data.loading ? null : (
        <TopicList
          views={data.views}
          today={data.today}
          loading={data.loading}
          error={data.error}
          onRetry={data.refetch}
          onOpen={open}
          onCreate={create}
          onGenerate={generateFromList}
        />
      )}
    </div>
  );
}
