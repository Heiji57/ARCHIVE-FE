/**
 * 연결 그래프 데이터. 시안 d-retro2.html 의 gBuild, gData, GNO[5](동심원), gDefault(GP=3) 를 옮겼다.
 * 주제 → 큰 주제 → 근거(회고, 할 일) → 그날 커밋 (06-topic §6: FE 가 정리 결과와 커밋을 합쳐 그린다).
 */
import type { GitHubCommit } from "@/entities/github/model/types";
import type { TaskStatus } from "@/entities/todo/model/types";
import type { TopicSourceMap, TopicStructured } from "@/entities/topic/model/types";
import type { ForceNode } from "@/shared/lib/force-graph/engine";

export type GraphKind = "tp" | "th" | "e" | "t" | "c";
export type GraphLinkKind = "th" | "src" | "cm";

export interface GraphNode extends ForceNode {
  id: string;
  k: GraphKind;
  /** 이름 */
  lb: string;
  /** 날짜(큰 주제, 주제는 없음) */
  d?: string;
  /** 할 일 상태 */
  st?: TaskStatus;
  /** 큰 주제 순서(색) */
  c?: number;
  /** 큰 주제 key */
  th?: string;
  /** 근거 id(회고, 할 일), 커밋 sha */
  ref?: string;
  /** 커밋이 붙은 회고 id */
  from?: string;
}

export type GraphLink = [a: string, b: string, kind: GraphLinkKind, color: string | null];

export interface TopicGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

/** 큰 주제 색(본문의 색 점과 같은 색) */
export const themeColor = (i: number) => `var(--th${(i % 4) + 1})`;

/** 동심원 반지름: 가운데 주제, 안쪽부터 큰 주제, 회고, 할 일, 커밋 (시안 GNO[5]) */
export const GRAPH_RADIAL: Record<GraphKind, number> = { tp: 0, th: 100, e: 200, t: 280, c: 345 };
export const GRAPH_RINGS: Array<[radius: number, kind: Exclude<GraphKind, "tp">]> = [
  [100, "th"],
  [200, "e"],
  [280, "t"],
  [345, "c"],
];

const TODO_COLOR: Record<TaskStatus, string> = {
  done: "var(--done)",
  "in-progress": "var(--warn)",
  "not-start": "var(--ink3)",
};

/** 점 색(종류별). 큰 주제는 제 색, 할 일은 상태 색 */
export function nodeColor(n: Pick<GraphNode, "k" | "c" | "st">): string {
  if (n.k === "th") return themeColor(n.c ?? 0);
  if (n.k === "t") return TODO_COLOR[n.st ?? "not-start"];
  return { tp: "var(--ink)", e: "var(--rc-d)", c: "var(--ink4)" }[n.k];
}

const commitDay = (c: GitHubCommit) => c.committedAt.slice(0, 10);

/**
 * 그래프 만들기. 지운 근거(sources 에 없는 것)를 가리키는 항목은 뺀다.
 * 커밋은 근거 회고 중 일간 회고의 날짜에 한 커밋을 그 회고에 잇는다.
 * `extraEntryIds`(정리 뒤에 쓴 회고)는 주제에 바로 잇는다.
 */
export function buildGraph(
  s: TopicStructured,
  sources: TopicSourceMap,
  commits: readonly GitHubCommit[],
  topicName = "",
): TopicGraph {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const idx = new Map<string, GraphNode>();
  const seen = new Set<string>();
  const add = (n: GraphNode) => {
    if (!idx.has(n.id)) {
      idx.set(n.id, n);
      nodes.push(n);
    }
    return idx.get(n.id)!;
  };
  const link = (a: string, b: string, k: GraphLinkKind, color: string | null = null) => {
    const key = [a, b].sort().join("|");
    if (seen.has(key)) return;
    seen.add(key);
    links.push([a, b, k, color]);
  };

  add({ id: "T", k: "tp", lb: topicName });
  s.themes.forEach((th, i) => {
    const hid = `h${th.key}`;
    add({ id: hid, k: "th", lb: th.name, c: i, th: th.key });
    link("T", hid, "th");
    for (const it of th.items) {
      const info = sources[it.source.id];
      if (!info) continue;
      if (info.kind === "entry") {
        add({ id: `e${it.source.id}`, k: "e", lb: info.title, d: info.dateKey, ref: it.source.id });
        link(hid, `e${it.source.id}`, "src", themeColor(i));
      } else {
        add({ id: `t${it.source.id}`, k: "t", lb: info.title, d: info.dateKey, st: info.status, ref: it.source.id });
        link(hid, `t${it.source.id}`, "src", themeColor(i));
      }
    }
  });

  for (const n of nodes.filter((x) => x.k === "e")) {
    const info = sources[n.ref!];
    if (!info || info.kind !== "entry" || info.retroType !== "daily") continue;
    for (const c of commits) {
      if (commitDay(c) !== info.dateKey) continue;
      add({ id: `c${c.sha}`, k: "c", lb: c.message.split("\n")[0], d: info.dateKey, ref: c.sha, from: n.ref });
      link(n.id, `c${c.sha}`, "cm");
    }
  }
  for (const n of nodes) {
    n.color = nodeColor(n);
    if (n.st) n.cls = n.st === "not-start" ? "open" : n.st === "in-progress" ? "doing" : "done";
  }
  return { nodes, links };
}

/** 이웃 id */
export function neighbors(g: TopicGraph, id: string): Set<string> {
  const s = new Set<string>();
  for (const [a, b] of g.links) {
    if (a === id) s.add(b);
    if (b === id) s.add(a);
  }
  return s;
}

/** 범례 겸 거르기의 수(회고, 할 일, 커밋) */
export function kindCounts(g: TopicGraph): Record<"e" | "t" | "c", number> {
  const o = { e: 0, t: 0, c: 0 };
  for (const n of g.nodes) if (n.k === "e" || n.k === "t" || n.k === "c") o[n.k] += 1;
  return o;
}

export type HiddenKinds = ReadonlySet<"e" | "t" | "c">;

/** 범례를 눌러 종류를 켜고 끔 */
export function toggleKind(hidden: HiddenKinds, k: "e" | "t" | "c"): Set<"e" | "t" | "c"> {
  const s = new Set(hidden);
  if (s.has(k)) s.delete(k);
  else s.add(k);
  return s;
}

export interface ThemeGroup {
  key: string;
  name: string;
  index: number;
  /** 큰 주제 점 id */
  nodeId: string;
  /** 큰 주제 점과 그 이웃(주제 빼고). 마우스를 올리면 이 점들이 밝아진다 */
  ids: string[];
  entries: number;
  todos: number;
  /** 처음 네 개 */
  members: GraphNode[];
  more: number;
}

/** 옆 칸 "큰 주제 N개로 나눈 자료" (시안 gDefault GP=3) */
export function themeGroups(g: TopicGraph, s: TopicStructured, show = 4): ThemeGroup[] {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  return s.themes.map((th, i) => {
    const nodeId = `h${th.key}`;
    const ms = [...neighbors(g, nodeId)].map((id) => byId.get(id)!).filter((n) => n && n.k !== "tp");
    return {
      key: th.key,
      name: th.name,
      index: i,
      nodeId,
      ids: [nodeId, ...ms.map((n) => n.id)],
      entries: ms.filter((n) => n.k === "e").length,
      todos: ms.filter((n) => n.k === "t").length,
      members: ms.slice(0, show),
      more: Math.max(0, ms.length - show),
    };
  });
}
