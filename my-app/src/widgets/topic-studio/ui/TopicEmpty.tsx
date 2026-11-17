import { useTranslation } from "@/shared/lib/i18n";
import type { TopicView } from "../model/useTopicStudioData";
import { TopicHeader } from "./TopicHeader";

/** 정리 전, 정리 중(시안 tvEmpty): 같은 상단(이름, 책갈피, 회고 수, 할 일 수)에 점선 안내 한 덩어리와 정리하기 */
export function TopicEmpty({
  view,
  failed,
  onGenerate,
  onRename,
  onDescribe,
  autoFocusName,
}: {
  view: TopicView;
  failed?: boolean;
  onGenerate: () => void;
  onRename: (name: string) => void;
  onDescribe: (d: string) => void;
  autoFocusName?: boolean;
}) {
  const { t } = useTranslation();
  const pend = view.status === "pending";
  const e = view.entries ?? 0;
  const td = view.todos ?? 0;
  return (
    <>
      <TopicHeader
        name={view.topic.name}
        description={view.topic.description}
        color={view.color}
        meta={[
          ...(view.entries != null ? [t("topic.v.count.entries", { n: e })] : []),
          ...(view.todos != null ? [t("topic.v.count.todos", { n: td })] : []),
          pend ? t("topic.v.organizing") : t("topic.v.state.notYet"),
        ]}
        onRename={onRename}
        onDescribe={onDescribe}
        autoFocusName={autoFocusName}
      />
      <div className="tv-empty" aria-live="polite">
        {pend ? (
          <>
            <p className="w">
              <i className="q-spin" aria-hidden="true" />
              {t("topic.v.pending.body")}
            </p>
            <p className="s">{t("topic.v.pending.hint")}</p>
          </>
        ) : (
          <>
            <p>{t("topic.v.empty.body", { e, t: td })}</p>
            <p className="s">{failed ? t("topic.generate.failed") : t("topic.v.empty.hint")}</p>
            <button type="button" className="q-bt" onClick={onGenerate}>
              {t("topic.v.organize")}
            </button>
          </>
        )}
      </div>
    </>
  );
}
