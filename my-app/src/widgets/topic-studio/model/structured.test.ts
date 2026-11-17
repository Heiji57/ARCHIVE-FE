import { describe, expect, it } from "vitest";
import type { TopicSourceMap, TopicStructured } from "@/entities/topic/model/types";
import { buildDemoTopics } from "@/entities/topic/model/demo";
import {
  assignTopicColors,
  entrySpan,
  flattenItems,
  recentItems,
  themeCounts,
  themeSpan,
  toTimeline,
  topicColorIndex,
  weekStartOf,
} from "./structured";

// 2026-11-03 은 화요일. 일요일 시작이면 이번 주 11/1 – 11/7, 지난주 10/25 – 10/31.
const TODAY = "2026-11-03";
const S: TopicStructured = {
  version: 1,
  summary: "요약",
  themes: [
    {
      key: "t1",
      name: "무한 스크롤",
      summary: "",
      items: [
        { dateKey: "2026-10-21", text: "a", source: { kind: "entry", id: "e1021" } },
        { dateKey: "2026-10-30", text: "b", source: { kind: "todo", id: "td1" } },
        { dateKey: "2026-11-02", text: "c", source: { kind: "entry", id: "e1102" } },
      ],
    },
    {
      key: "t2",
      name: "끌어 놓기",
      summary: "",
      items: [
        { dateKey: "2026-11-02", text: "d", source: { kind: "entry", id: "e1102" } },
        { dateKey: "2026-11-03", text: "e", source: { kind: "todo", id: "td2" } },
        { dateKey: "2026-11-05", text: "f", source: { kind: "todo", id: "td3" } },
      ],
    },
  ],
};
const SRC: TopicSourceMap = {
  e1021: { kind: "entry", title: "10/21", dateKey: "2026-10-21", retroType: "daily" },
  e1102: { kind: "entry", title: "11/2", dateKey: "2026-11-02", retroType: "daily" },
  td1: { kind: "todo", title: "보정", dateKey: "2026-10-30", status: "done" },
  td2: { kind: "todo", title: "고치기", dateKey: "2026-11-03", status: "in-progress" },
  td3: { kind: "todo", title: "마무리", dateKey: "2026-11-05", status: "not-start" },
};

describe("weekStartOf", () => {
  it("일요일 시작과 월요일 시작", () => {
    expect(weekStartOf("2026-11-03", 0)).toBe("2026-11-01");
    expect(weekStartOf("2026-11-03", 1)).toBe("2026-11-02");
    expect(weekStartOf("2026-11-01", 1)).toBe("2026-10-26");
  });
});

describe("flattenItems", () => {
  it("날짜 순, 같은 날은 큰 주제 순", () => {
    expect(flattenItems(S, SRC).map((x) => x.text)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
  it("지운 근거는 info 가 null", () => {
    const rest = { ...SRC };
    delete rest.td1;
    expect(flattenItems(S, rest).find((x) => x.text === "b")!.info).toBeNull();
  });
});

describe("toTimeline", () => {
  it("주 이름으로 나눈다: 앞으로 할 일, 이번 주, 지난주, 그 전 주는 주 첫날", () => {
    const w = toTimeline(S, SRC, TODAY);
    expect(w.map((x) => x.weekLabel)).toEqual(["upcoming", "thisWeek", "lastWeek", "2026-10-18"]);
    expect(w.map((x) => x.weekStart)).toEqual([null, "2026-11-01", "2026-10-25", "2026-10-18"]);
  });
  it("최근 날이 위, 앞으로 할 일은 오늘 뒤의 날만", () => {
    const w = toTimeline(S, SRC, TODAY);
    expect(w[0].days.map((d) => d.dateKey)).toEqual(["2026-11-05"]);
    expect(w[0].days[0].future).toBe(true);
    expect(w[1].days.map((d) => d.dateKey)).toEqual(["2026-11-03", "2026-11-02"]);
    expect(w[1].days[0].today).toBe(true);
  });
  it("하루 카드에 그날 회고 id 를 중복 없이", () => {
    const day = toTimeline(S, SRC, TODAY)[1].days[1];
    expect(day.items.map((x) => x.text)).toEqual(["c", "d"]);
    expect(day.entryIds).toEqual(["e1102"]);
  });
  it("고른 큰 주제만 거르고 빈 날과 주는 뺀다", () => {
    const w = toTimeline(S, SRC, TODAY, { themeKey: "t2" });
    expect(w.map((x) => x.weekLabel)).toEqual(["upcoming", "thisWeek"]);
    expect(w.flatMap((x) => x.days.flatMap((d) => d.items.map((i) => i.themeKey)))).toEqual(["t2", "t2", "t2"]);
  });
  it("월요일 시작이면 주 경계가 바뀐다", () => {
    // 월요일 시작: 이번 주 11/2 – 11/8, 11/2 는 이번 주, 10/30 은 지난주(10/26 –)
    const w = toTimeline(S, SRC, TODAY, { weekStartsOn: 1 });
    expect(w.map((x) => x.weekLabel)).toEqual(["upcoming", "thisWeek", "lastWeek", "2026-10-19"]);
  });
});

describe("recentItems", () => {
  it("오늘까지 항목을 최근 순으로 n 개", () => {
    expect(recentItems(S, SRC, TODAY, 3).map((x) => x.text)).toEqual(["e", "d", "c"]);
  });
});

describe("themeCounts, themeSpan, entrySpan", () => {
  it("회고는 중복 없이, 할 일은 항목 수", () => {
    expect(themeCounts(S.themes[0])).toEqual({ entries: 2, todos: 1 });
    expect(themeSpan(S.themes[1])).toEqual(["2026-11-02", "2026-11-05"]);
    expect(entrySpan(S, SRC)).toEqual(["2026-10-21", "2026-11-02"]);
  });
});

describe("topicColorIndex", () => {
  const T = [
    { id: "c", createdAt: "2026-10-03" },
    { id: "a", createdAt: "2026-10-01" },
    { id: "b", createdAt: "2026-10-02" },
    { id: "d", createdAt: "2026-10-04" },
    { id: "e", createdAt: "2026-10-05" },
  ];
  it("목록 위치가 아니라 createdAt 순서로 4색을 돌려 쓴다", () => {
    expect(T.map((t) => topicColorIndex(T, t.id))).toEqual([2, 0, 1, 3, 0]);
  });
  it("주제를 지워도 다른 주제 색이 그대로다", () => {
    const before = assignTopicColors(T);
    const after = assignTopicColors(T.filter((t) => t.id !== "a"), before);
    for (const id of ["b", "c", "d", "e"]) expect(after[id]).toBe(before[id]);
  });
  it("지운 뒤 새 주제는 비는 색을 받는다", () => {
    const before = assignTopicColors(T.slice(0, 4));
    const left = T.slice(0, 4).filter((t) => t.id !== "b");
    const after = assignTopicColors([...left, { id: "f", createdAt: "2026-10-09" }], before);
    expect(after.f).toBe(before.b);
  });
});

describe("데모 데이터", () => {
  const demo = buildDemoTopics("2026-06-15");
  it("시안의 주제 4개, 기준일만큼 날짜를 옮긴다", () => {
    expect(demo.topics.map((t) => t.name)).toEqual(["캘린더 다듬기", "인증 · 토큰", "i18n", "알고리즘 스터디"]);
    // 시안 11/2 → 데모 6/14 (141일 앞)
    expect(demo.digests.tp1.watermarkDateKey).toBe("2026-06-14");
    expect(demo.topics.map((t) => [t.entryCount, t.todoCount])).toEqual([[6, 9], [3, 4], [2, 3], [1, 2]]);
    expect(demo.digests.tp2.unreflectedEntryCount).toBe(1);
    expect(demo.digests.tp4.status).toBe("none");
  });
  it("모든 근거가 sources 에 있다", () => {
    for (const [id, d] of Object.entries(demo.digests)) {
      for (const th of d.structured.themes) for (const it of th.items) expect(d.sources[it.source.id], `${id} ${it.source.id}`).toBeTruthy();
    }
  });
  it("주제 색은 시안 순서와 같다", () => {
    expect(demo.topics.map((t) => topicColorIndex(demo.topics, t.id))).toEqual([0, 1, 2, 3]);
  });
});
