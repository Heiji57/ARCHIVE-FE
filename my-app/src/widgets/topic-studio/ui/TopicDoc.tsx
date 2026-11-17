import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { EditorErrorBoundary } from "@/shared/ui/rich-editor";
import type { TopicStudioData, TopicView } from "../model/useTopicStudioData";
import { entryTitle, md2, plainText, spanText } from "../model/format";
import { toTimeline } from "../model/structured";
import { DayTimeline } from "./DayTimeline";
import { ThemeFilter } from "./ThemeFilter";
import { TopicEmpty } from "./TopicEmpty";
import { TopicGraph } from "./TopicGraph";
import { TopicHeader } from "./TopicHeader";
import { DocGlyph, GraphGlyph, KindIcon } from "./parts";

const RichEditor = lazy(() => import("@/shared/ui/rich-editor/ui/RichEditor"));

export interface TopicDocProps {
  view: TopicView;
  graph: boolean;
  data: Pick<TopicStudioData, "today" | "entries" | "commits" | "structuredOn" | "open">;
  onBack: () => void;
  onSetView: (v: "doc" | "graph") => void;
  onGenerate: () => void;
  onRename: (name: string) => void;
  onDescribe: (d: string) => void;
  onOpenEntry: (id: string) => void;
  autoFocusName?: boolean;
}

/** 주제 본문: 문서(하루 카드 흐름) / 연결 그래프, 정리 전과 정리 중 */
export function TopicDoc({ view, graph, data, onBack, onSetView, onGenerate, onRename, onDescribe, onOpenEntry, autoFocusName }: TopicDocProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<string | null>(null);
  const { topic, structured } = view;
  const pend = view.status === "pending";
  const organized = view.status === "completed";
  const canGraph = organized && !!structured;
  const showGraph = graph && canGraph;

  const weeks = useMemo(
    () => (structured ? toTimeline(structured, view.sources, data.today, { themeKey: theme }) : []),
    [structured, view.sources, data.today, theme],
  );
  const titleOf = useCallback(
    (id: string) => {
      const info = view.sources[id];
      return info && info.kind === "entry" ? entryTitle(t, info) : "";
    },
    [view.sources, t],
  );
  const textOf = useCallback((id: string) => (data.entries[id] ? plainText(data.entries[id].body) : null), [data.entries]);

  const meta = [
    ...(view.span ? [spanText(view.span)] : []),
    ...(view.entries != null ? [t("topic.v.count.entries", { n: view.entries })] : []),
    ...(view.todos != null ? [t("topic.v.count.todos", { n: view.todos })] : []),
    ...(view.watermark ? [t("topic.v.until", { date: md2(view.watermark) })] : []),
  ];

  let body;
  if (!organized) {
    body = (
      <article className="tvd">
        <TopicEmpty
          view={view}
          failed={data.open.generateError}
          onGenerate={onGenerate}
          onRename={onRename}
          onDescribe={onDescribe}
          autoFocusName={autoFocusName}
        />
      </article>
    );
  } else if (showGraph && structured) {
    body = (
      <TopicGraph
        topicName={topic.name}
        structured={structured}
        sources={view.sources}
        commits={data.commits}
        entryText={textOf}
        entryTitle={titleOf}
        onOpenEntry={onOpenEntry}
        onOpenDoc={() => onSetView("doc")}
      />
    );
  } else if (structured) {
    body = (
      <article className="tvd">
        <TopicHeader
          name={topic.name}
          description={topic.description}
          color={view.color}
          meta={meta}
          lead={structured.summary}
          onRename={onRename}
          onDescribe={onDescribe}
          autoFocusName={autoFocusName}
        />
        <p className="ks-key">
          <span className="ks k-r">
            <KindIcon kind="r" />
            {t("topic.v.key.entry")}
          </span>
          <span className="ks k-done">
            <KindIcon kind="done" />
            {t("topic.v.key.done")}
          </span>
          <span className="ks k-doing">
            <KindIcon kind="doing" />
            {t("topic.v.key.doing")}
          </span>
          <span className="ks k-open">
            <KindIcon kind="open" />
            {t("topic.v.key.open")}
          </span>
        </p>
        <ThemeFilter structured={structured} value={theme} onChange={setTheme} />
        <DayTimeline
          weeks={weeks}
          today={data.today}
          sources={view.sources}
          entries={data.entries}
          commits={data.commits}
          onOpenEntry={onOpenEntry}
        />
      </article>
    );
  } else {
    // 실제 모드, 구조화 정리 결과가 서버에 없을 때: 새 머리 아래에 기존 markdown 정리 결과
    body = (
      <article className="tvd">
        <TopicHeader
          name={topic.name}
          description={topic.description}
          color={view.color}
          meta={meta}
          onRename={onRename}
          onDescribe={onDescribe}
          autoFocusName={autoFocusName}
        />
        {data.structuredOn ? <p className="tv-md-hint">{t("topic.v.md.hint")}</p> : null}
        {data.open.markdown ? (
          <EditorErrorBoundary fallback={() => <p className="tv-md-hint">{data.open.markdown}</p>}>
            <Suspense fallback={null}>
              <RichEditor value={data.open.markdown} editable={false} />
            </Suspense>
          </EditorErrorBoundary>
        ) : null}
      </article>
    );
  }

  return (
    <div className="q-ed" data-tdoc={topic.id}>
      <div className="q-eb">
        <button type="button" className="q-bt g" onClick={onBack}>
          <ChevronLeft size={14} strokeWidth={ICON_STROKE} />
          {t("topic.v.back")}
        </button>
        <span className="sp" />
        {canGraph ? (
          <div className="sw1" role="group" aria-label={t("topic.v.view.group")}>
            <button type="button" aria-pressed={!showGraph} aria-label={t("topic.v.view.doc")} title={t("topic.v.view.docShort")} onClick={() => onSetView("doc")}>
              <DocGlyph />
            </button>
            <button type="button" aria-pressed={showGraph} aria-label={t("topic.v.view.graph")} title={t("topic.v.view.graphShort")} onClick={() => onSetView("graph")}>
              <GraphGlyph />
            </button>
          </div>
        ) : null}
        {organized ? (
          <button type="button" className="q-bt" onClick={onGenerate}>
            {t("topic.v.reorganize")}
          </button>
        ) : pend ? null : (
          <button type="button" className="q-bt" onClick={onGenerate}>
            {t("topic.v.organize")}
          </button>
        )}
      </div>
      <div className={`q-es${showGraph ? " tvg-es" : ""}`}>{body}</div>
    </div>
  );
}
