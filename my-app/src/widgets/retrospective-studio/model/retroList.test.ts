import { describe, expect, it } from "vitest";
import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import {
  cardHead,
  entryInRange,
  groupByMonth,
  monthWeekCount,
  periodRange,
  plainExcerpt,
  prevActions,
  retroPeriod,
  sortForList,
  summaryWeekNo,
} from "./retroList";

const e = (id: string, retroType: RetrospectiveType, dateKey: string, content = "x"): JournalEntry => ({
  id,
  dateKey,
  content,
  updatedAt: "2026-11-03T00:00:00Z",
  title: "",
  githubPush: null,
  synced: true,
  retroType,
  isSummary: retroType !== "daily",
  folderId: null,
});

describe("retroPeriod", () => {
  it("일간은 그날 하루", () => {
    expect(retroPeriod("daily", "2026-11-02")).toEqual({ start: "2026-11-02", end: "2026-11-02" });
  });
  it("주간은 dateKey 가 든 ISO 주(월~일)", () => {
    expect(retroPeriod("weekly", "2026-11-01")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
  });
  it("월간은 그 달, 연간은 그 해", () => {
    expect(retroPeriod("monthly", "2026-10-31")).toEqual({ start: "2026-10-01", end: "2026-10-31" });
    expect(retroPeriod("yearly", "2025-12-31")).toEqual({ start: "2025-01-01", end: "2025-12-31" });
  });
});

describe("sortForList / groupByMonth", () => {
  const list = sortForList([
    e("y25", "yearly", "2025-12-31"),
    e("d1020", "daily", "2026-10-20"),
    e("m10", "monthly", "2026-10-31"),
    e("d1102", "daily", "2026-11-02"),
    e("w1101", "weekly", "2026-11-01"),
    e("d1101", "daily", "2026-11-01"),
    e("d1030", "daily", "2026-10-30"),
  ]);

  it("기간 시작일 최신순(주간은 시작한 날 자리)", () => {
    expect(list.map((x) => x.id)).toEqual(["d1102", "d1101", "d1030", "w1101", "d1020", "m10", "y25"]);
  });

  it("달마다 묶고 편 수를 센다. 연간은 해로 묶는다", () => {
    const g = groupByMonth(list);
    expect(g.map((x) => [x.monthKey, x.count, x.yearOnly])).toEqual([
      ["2026-11", 2, false],
      ["2026-10", 4, false],
      ["2025", 1, true],
    ]);
    expect(g[1].entries.map((x) => x.id)).toEqual(["d1030", "w1101", "d1020", "m10"]);
  });

  it("빈 목록은 빈 묶음", () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe("cardHead", () => {
  it("일간: 날짜 숫자와 요일 자리", () => {
    expect(cardHead(e("a", "daily", "2026-11-02"))).toEqual({ kind: "day", day: 2, dateKey: "2026-11-02" });
  });
  it("주간: 시작 M/D 와 끝 M/D", () => {
    expect(cardHead(e("a", "weekly", "2026-11-01"))).toEqual({ kind: "range", start: "10/26", end: "11/1" });
  });
  it("월간: 달 숫자와 해, 연간: 해", () => {
    expect(cardHead(e("a", "monthly", "2026-10-31"))).toEqual({ kind: "month", month: 10, year: 2026 });
    expect(cardHead(e("a", "yearly", "2025-12-31"))).toEqual({ kind: "year", year: 2025 });
  });
});

describe("summaryWeekNo", () => {
  it("주간 요약 제목의 'n주차'는 시작일이 그 달 몇째 칠일인지", () => {
    expect(summaryWeekNo("2026-11-01")).toEqual({ month: 10, week: 4 });
    expect(summaryWeekNo("2026-10-25")).toEqual({ month: 10, week: 3 });
    expect(summaryWeekNo("2026-11-08")).toEqual({ month: 11, week: 1 });
  });
});

describe("periodRange / entryInRange", () => {
  it("연도 전체면 null", () => {
    expect(periodRange("all", "all", "all")).toBeNull();
  });
  it("연, 월 범위", () => {
    expect(periodRange("2026", "all", "all")).toEqual({ from: "2026-01-01", to: "2026-12-31", level: "year" });
    expect(periodRange("2026", "10", "all")).toEqual({ from: "2026-10-01", to: "2026-10-31", level: "month" });
  });
  it("n주는 일요일에 시작하는 달력 줄을 그 달 안으로 자른다", () => {
    // 2026-11-01 은 일요일
    expect(periodRange("2026", "11", "1")).toEqual({ from: "2026-11-01", to: "2026-11-07", level: "week" });
    // 2026-10-01 은 목요일: 1주 = 10/1~10/3, 5주 = 10/25~10/31
    expect(periodRange("2026", "10", "1")).toEqual({ from: "2026-10-01", to: "2026-10-03", level: "week" });
    expect(periodRange("2026", "10", "5")).toEqual({ from: "2026-10-25", to: "2026-10-31", level: "week" });
  });
  it("달의 주 수", () => {
    expect(monthWeekCount(2026, 10)).toBe(5);
    expect(monthWeekCount(2026, 11)).toBe(5);
    expect(monthWeekCount(2026, 8)).toBe(6);
  });
  it("기간이 겹치면 들어가고, 월을 고르면 연간, 주를 고르면 월간도 뺀다", () => {
    const oct = periodRange("2026", "10", "all")!;
    expect(entryInRange(e("w", "weekly", "2026-11-01"), oct)).toBe(true);
    expect(entryInRange(e("m", "monthly", "2026-10-31"), oct)).toBe(true);
    expect(entryInRange(e("y", "yearly", "2026-12-31"), oct)).toBe(false);
    expect(entryInRange(e("d", "daily", "2026-11-02"), oct)).toBe(false);
    const wk = periodRange("2026", "10", "5")!;
    expect(entryInRange(e("d", "daily", "2026-10-30"), wk)).toBe(true);
    expect(entryInRange(e("m", "monthly", "2026-10-31"), wk)).toBe(false);
    expect(entryInRange(e("y", "yearly", "2025-12-31"), periodRange("2025", "all", "all")!)).toBe(true);
  });
});

describe("plainExcerpt", () => {
  it("머리글은 빼고 목록 기호, 강조, 코드, 링크를 걷어 한 줄로", () => {
    const md = "## 오늘 한 일\n- **토큰** 재발급 `pendingRefresh` 수정\n- [문서](https://x.y) 정리\n\n> 인용\n## 배운 점\n그냥 문장";
    expect(plainExcerpt(md)).toBe("토큰 재발급 pendingRefresh 수정 문서 정리 인용 그냥 문장");
  });
  it("길면 자른다", () => {
    expect(plainExcerpt("가".repeat(200), 10)).toBe("가".repeat(10));
  });
});

describe("prevActions", () => {
  const prev = e("d1101", "daily", "2026-11-01", "## 오늘 한 일\n- a\n## 내일\n- 계획 하나\n- 계획 둘\n## 느낀 점\n끝");
  const older = e("d1030", "daily", "2026-10-30", "## 다음에\n- 오래된 것");
  it("바로 앞 일간 회고의 '내일/다음' 머리글 아래 목록", () => {
    const cur = e("d1102", "daily", "2026-11-02");
    expect(prevActions([older, prev, cur], cur)).toEqual([
      { key: "d1101:0", text: "계획 하나", fromDateKey: "2026-11-01" },
      { key: "d1101:1", text: "계획 둘", fromDateKey: "2026-11-01" },
    ]);
  });
  it("앞 회고에 없으면 그 앞을 본다. 일간이 아니면 빈 목록", () => {
    const cur = e("d1031", "daily", "2026-10-31");
    expect(prevActions([older, prev, cur], cur).map((x) => x.text)).toEqual(["오래된 것"]);
    expect(prevActions([older, prev], e("w", "weekly", "2026-11-08"))).toEqual([]);
  });
});
