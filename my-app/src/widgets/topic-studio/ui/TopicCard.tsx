import { useTranslation } from "@/shared/lib/i18n";
import type { TopicView } from "../model/useTopicStudioData";
import { md2, spanText } from "../model/format";
import { isOrganized, topicColorStyle } from "../model/viewHelpers";
import { TopicGlyph } from "./parts";

/** 상태 알약: 정리 중, 정리 전, 새 회고 n */
export function TopicStatePill({ view }: { view: TopicView }) {
  const { t } = useTranslation();
  if (view.status === "pending") return <span className="q-st">{t("topic.v.state.pending")}</span>;
  if (view.status !== "completed") return <span className="q-st">{t("topic.v.state.none")}</span>;
  if (view.newer) return <span className="q-st nw">{t("topic.v.state.newer", { n: view.newer })}</span>;
  return null;
}

/** 목록 카드(시안 tk6): 이름을 주제 색으로 크게, 위 가장자리 책갈피, 요약과 "이런 회고를 모아요", 바닥줄 */
export function TopicCard({ view, onOpen }: { view: TopicView; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const { topic } = view;
  const org = isOrganized(view);
  return (
    <button
      type="button"
      className={`q-cd k-topic${view.status === "completed" ? "" : " un"}`}
      style={topicColorStyle(view.color)}
      onClick={() => onOpen(topic.id)}
    >
      <span className="tk-rib" aria-hidden="true" />
      <span className="mt">
        <span className="q-ty">
          <TopicGlyph />
          {t("topic.v.kind")}
        </span>
        <span className="d">{spanText(view.span)}</span>
        <span className="sp" />
        <TopicStatePill view={view} />
      </span>
      <span className="tk-name">{topic.name}</span>
      <span className="ex">{org ? view.structured!.summary : topic.description}</span>
      {org ? (
        <span className="tk-desc">
          <small>{t("topic.v.collects")}</small>
          {topic.description}
        </span>
      ) : null}
      <span className="ft">
        {view.entries != null ? <span>{t("topic.v.count.entries", { n: view.entries })}</span> : null}
        {view.todos != null ? <span>{t("topic.v.count.todos", { n: view.todos })}</span> : null}
        <span className="sp" />
        <span>{view.watermark ? t("topic.v.until", { date: md2(view.watermark) }) : t("topic.v.state.none")}</span>
      </span>
    </button>
  );
}
