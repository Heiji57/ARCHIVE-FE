import { describe, expect, it } from "vitest";
import { buildDemoTopics } from "@/entities/topic/model/demo";
import type { GitHubCommit } from "@/entities/github/model/types";
import type { TopicSourceMap, TopicStructured } from "@/entities/topic/model/types";
import { GRAPH_RADIAL, GRAPH_RINGS, buildGraph, kindCounts, nodeColor, themeGroups, toggleKind } from "./graphModel";

const S: TopicStructured = {
  version: 1,
  summary: "",
  themes: [
    {
      key: "t1",
      name: "A",
      summary: "",
      items: [
        { dateKey: "2026-10-30", text: "", source: { kind: "entry", id: "e1" } },
        { dateKey: "2026-10-30", text: "", source: { kind: "todo", id: "td1" } },
        { dateKey: "2026-10-31", text: "", source: { kind: "todo", id: "gone" } },
      ],
    },
    {
      key: "t2",
      name: "B",
      summary: "",
      items: [
        { dateKey: "2026-10-30", text: "", source: { kind: "entry", id: "e1" } },
        { dateKey: "2026-10-31", text: "", source: { kind: "entry", id: "w1" } },
      ],
    },
  ],
};
const SRC: TopicSourceMap = {
  e1: { kind: "entry", title: "회고", dateKey: "2026-10-30", retroType: "daily" },
  w1: { kind: "entry", title: "주간", dateKey: "2026-10-31", retroType: "weekly" },
  td1: { kind: "todo", title: "할 일", dateKey: "2026-10-30", status: "not-start" },
};
const commit = (sha: string, day: string): GitHubCommit => ({
  repositoryId: "r",
  fullName: "o/r",
  sha,
  message: `msg ${sha}\nbody`,
  htmlUrl: "",
  author: "a",
  committedAt: `${day}T10:00:00+09:00`,
});
const CM = [commit("c1", "2026-10-30"), commit("c2", "2026-10-30"), commit("c3", "2026-10-31"), commit("c4", "2026-10-01")];

describe("buildGraph", () => {
  const g = buildGraph(S, SRC, CM, "주제");
  it("노드 수: 주제 1, 큰 주제 2, 회고 2, 할 일 1, 그날 커밋 2", () => {
    expect(g.nodes.map((n) => n.id)).toEqual(["T", "ht1", "ee1", "ttd1", "ht2", "ew1", "cc1", "cc2"]);
    expect(kindCounts(g)).toEqual({ e: 2, t: 1, c: 2 });
  });
  it("근거 없는(지운) 항목은 뺀다", () => {
    expect(g.nodes.some((n) => n.ref === "gone")).toBe(false);
  });
  it("같은 근거가 여러 큰 주제에 들어가면 선이 여러 개, 같은 선은 한 번", () => {
    expect(g.links.filter((l) => l[1] === "ee1").map((l) => l[0])).toEqual(["ht1", "ht2"]);
    expect(g.links).toHaveLength(2 + 4 + 2);
  });
  it("커밋은 일간 회고 날짜에만 잇고 첫 줄을 이름으로", () => {
    expect(g.links.filter((l) => l[2] === "cm").map((l) => [l[0], l[1]])).toEqual([["ee1", "cc1"], ["ee1", "cc2"]]);
    expect(g.nodes.find((n) => n.id === "cc1")!.lb).toBe("msg c1");
  });
  it("점 색: 큰 주제 제 색, 할 일 상태 색, 회고 라벤더", () => {
    expect(g.nodes.find((n) => n.id === "ht2")!.color).toBe("var(--th2)");
    expect(nodeColor({ k: "t", st: "in-progress" })).toBe("var(--warn)");
    expect(g.nodes.find((n) => n.id === "ttd1")!.cls).toBe("open");
    expect(g.nodes.find((n) => n.id === "ee1")!.color).toBe("var(--rc-d)");
  });
});

describe("동심원", () => {
  it("고리 반지름 순서: 주제 → 큰 주제 → 회고 → 할 일 → 커밋", () => {
    const order = (["tp", "th", "e", "t", "c"] as const).map((k) => GRAPH_RADIAL[k]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(5);
    expect(GRAPH_RINGS.map(([, k]) => k)).toEqual(["th", "e", "t", "c"]);
  });
});

describe("그래프 상태", () => {
  it("범례를 눌러 종류를 켜고 끔", () => {
    const a = toggleKind(new Set(), "c");
    expect([...a]).toEqual(["c"]);
    expect([...toggleKind(a, "c")]).toEqual([]);
  });
  it("옆 칸 큰 주제별 자료: 이웃 수와 앞 네 개", () => {
    const demo = buildDemoTopics("2026-11-03");
    const d = demo.digests.tp1;
    const g = buildGraph(d.structured, d.sources, demo.commits, "캘린더 다듬기");
    const gs = themeGroups(g, d.structured);
    // 시안: 무한 스크롤 회고 3, 할 일 2 / 경계 케이스 회고 2, 할 일 2 / 끌어 놓기 회고 2, 할 일 2 / 계획과 리뷰 회고 2, 할 일 3
    expect(gs.map((x) => [x.entries, x.todos])).toEqual([[3, 2], [2, 2], [2, 2], [2, 3]]);
    expect(gs[0].members).toHaveLength(4);
    expect(gs[0].more).toBe(1);
    expect(gs[0].ids[0]).toBe("ht1");
    expect(kindCounts(g)).toEqual({ e: 6, t: 9, c: 5 });
  });
});
