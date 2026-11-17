import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GitHubCommit } from "@/entities/github/model/types";
import type { TopicSourceMap, TopicStructured } from "@/entities/topic/model/types";
import { createForceGraph, type ForceGraphApi } from "@/shared/lib/force-graph/engine";
import { useTranslation } from "@/shared/lib/i18n";
import {
  GRAPH_RADIAL,
  GRAPH_RINGS,
  buildGraph,
  kindCounts,
  toggleKind,
  type GraphNode,
  type HiddenKinds,
} from "../model/graphModel";
import { GraphSidePanel } from "./GraphSidePanel";

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export interface TopicGraphProps {
  topicName: string;
  structured: TopicStructured;
  sources: TopicSourceMap;
  commits: GitHubCommit[];
  /** 회고 본문(데모) — 고른 회고의 앞부분을 보여 준다 */
  entryText: (id: string) => string | null;
  entryTitle: (id: string) => string;
  onOpenEntry: (id: string) => void;
  onOpenDoc: () => void;
}

/**
 * 연결 보기(시안 gView2 GV=1): 위 바에 범례 겸 거르기(GT=2), 가운데 동심원 그래프(GN=5), 오른쪽 큰 주제별 자료(GP=3).
 * 점을 고르면 옆 칸이 그 점의 내용으로 바뀐다.
 */
export function TopicGraph({ topicName, structured, sources, commits, entryText, entryTitle, onOpenEntry, onOpenDoc }: TopicGraphProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const api = useRef<ForceGraphApi<GraphNode> | null>(null);
  const [hidden, setHidden] = useState<HiddenKinds>(() => new Set());
  const [sel, setSel] = useState<GraphNode | null>(null);

  const kindLabel = (k: GraphNode["k"]) => t(`topic.v.graph.kind.${k}`);
  const graph = useMemo(() => {
    const g = buildGraph(structured, sources, commits, topicName);
    for (const n of g.nodes) {
      if (n.k === "e" && n.ref) n.lb = entryTitle(n.ref);
      n.short = short(n.lb, n.k === "tp" || n.k === "th" ? 20 : 14);
      n.aria = `${t(`topic.v.graph.kind.${n.k}`)} ${n.lb}`;
    }
    return g;
  }, [structured, sources, commits, topicName, entryTitle, t]);
  const counts = kindCounts(graph);

  const ringLabels = GRAPH_RINGS.map(([r, k]) => [r, t(`topic.v.graph.kind.${k}`)] as [number, string]);
  const ringKey = ringLabels.map((x) => x[1]).join("|");
  const aria = t("topic.v.graph.aria", { name: topicName });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const g = createForceGraph<GraphNode>(svg, {
      radial: GRAPH_RADIAL,
      rings: ringKey.split("|").map((lb, i) => [GRAPH_RINGS[i][0], lb]),
      label: aria,
      onSelect: (n) => setSel(n),
    });
    api.current = g;
    return () => {
      g.destroy();
      api.current = null;
    };
  }, [ringKey, aria]);

  useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.set({ nodes: graph.nodes, links: graph.links });
  }, [graph, ringKey, aria]);

  useEffect(() => {
    api.current?.hide(hidden);
  }, [hidden, graph, ringKey]);

  const legend: Array<[GraphNode["k"], ReactNode]> = [
    ["tp", <svg key="tp" viewBox="-6 -6 12 12" aria-hidden="true"><circle r="4.5" fill="var(--ink)" /></svg>],
    ["th", <svg key="th" viewBox="-6 -6 12 12" aria-hidden="true"><circle r="4" fill="none" stroke="var(--th1)" strokeWidth="2.2" /></svg>],
    ["e", <svg key="e" viewBox="-6 -6 12 12" aria-hidden="true"><circle r="4.5" fill="var(--rc-d)" /></svg>],
    ["t", <svg key="t" viewBox="-6 -6 12 12" aria-hidden="true"><circle r="4.5" fill="var(--done)" /></svg>],
    ["c", <svg key="c" viewBox="-6 -6 12 12" aria-hidden="true"><circle r="2.5" fill="var(--ink4)" /></svg>],
  ];

  return (
    <div className="tvg tvg1">
      <div className="tvg-bar">
        <div className="gt2" role="group" aria-label={t("topic.v.graph.show")}>
          {(["e", "t", "c"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={!hidden.has(k)} onClick={() => setHidden((h) => toggleKind(h, k))}>
              <i className={`k-${k}`} />
              <span>{kindLabel(k)}</span>
              <small>{counts[k]}</small>
            </button>
          ))}
        </div>
        <span className="sp" />
        <span className="hint">{t("topic.v.graph.hint")}</span>
      </div>
      <div className="tvg-b">
        <div className="tg-wrap">
          <svg ref={svgRef} className="tg-s" />
          <div className="tg-zoom" role="group" aria-label={t("topic.v.graph.zoom")}>
            <button type="button" aria-label={t("topic.v.graph.zoomIn")} onClick={() => api.current?.zoom(1.25)}>
              +
            </button>
            <button type="button" aria-label={t("topic.v.graph.zoomOut")} onClick={() => api.current?.zoom(0.8)}>
              −
            </button>
            <button type="button" onClick={() => api.current?.fit()}>
              {t("topic.v.graph.fit")}
            </button>
          </div>
          <div className="tg-leg" aria-label={t("topic.v.graph.legend")}>
            {legend.map(([k, sw]) => (
              <span key={k}>
                {sw}
                {kindLabel(k)}
              </span>
            ))}
          </div>
        </div>
        <GraphSidePanel
          graph={graph}
          structured={structured}
          selected={sel}
          kindLabel={kindLabel}
          entryText={entryText}
          onHighlight={(ids) => api.current?.hl(ids)}
          onPick={(id) => api.current?.select(id)}
          onClear={() => api.current?.select(null)}
          onOpenEntry={onOpenEntry}
          onOpenDoc={onOpenDoc}
        />
      </div>
    </div>
  );
}
