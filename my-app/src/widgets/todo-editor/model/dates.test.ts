import { describe, expect, it } from "vitest";
import type { Todo } from "@/entities/todo/model/types";
import {
  nextOccurrences,
  overlapping,
  parseDayQuery,
  quickDates,
  quickDueDates,
  shiftTimeRange,
} from "./dates";

// 2026-11-03 은 화요일.
const TODAY = "2026-11-03";

describe("quickDates / quickDueDates", () => {
  it("오늘, 내일, 모레, 이번 주말(토), 다음 주 월요일", () => {
    expect(quickDates(TODAY).map((q) => q.dateKey)).toEqual([
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-07",
      "2026-11-09",
    ]);
  });

  it("마감: 다음 날, 그 주 금요일, 일주일 뒤 (금요일이면 다음 주 금요일)", () => {
    expect(quickDueDates(TODAY).map((q) => q.dateKey)).toEqual(["2026-11-04", "2026-11-06", "2026-11-10"]);
    expect(quickDueDates("2026-11-06")[1].dateKey).toBe("2026-11-13");
  });
});

describe("parseDayQuery", () => {
  it.each([
    ["2026-12-01", "2026-12-01"],
    ["11/9", "2026-11-09"],
    ["11월 9일", "2026-11-09"],
    ["9일", "2026-11-09"],
    ["9", "2026-11-09"],
    ["2", "2026-12-02"],
    ["1월 5일", "2027-01-05"],
    ["금", "2026-11-06"],
    ["화요일", "2026-11-10"],
    ["fri", "2026-11-06"],
  ])("%s → %s", (q, want) => {
    expect(parseDayQuery(q, TODAY)).toBe(want);
  });

  it("알아볼 수 없으면 null", () => {
    expect(parseDayQuery("", TODAY)).toBeNull();
    expect(parseDayQuery("내일 오후", TODAY)).toBeNull();
    expect(parseDayQuery("2월 30일", TODAY)).toBeNull();
  });
});

describe("shiftTimeRange", () => {
  it("길이를 유지하고, 없으면 1시간", () => {
    expect(shiftTimeRange("14:00", {})).toEqual({ startTime: "14:00", endTime: "15:00" });
    expect(shiftTimeRange("09:00", { startTime: "10:00", endTime: "11:30" })).toEqual({
      startTime: "09:00",
      endTime: "10:30",
    });
    expect(shiftTimeRange("23:30", {}).endTime).toBe("23:59");
  });
});

describe("overlapping", () => {
  const base = { status: "not-start", dateKey: TODAY } as Todo;
  const todos = [
    { ...base, id: "a", title: "A", startTime: "13:00", endTime: "15:30" },
    { ...base, id: "b", title: "B", startTime: "16:00", endTime: "17:00" },
    { ...base, id: "c", title: "C", startTime: "14:00", endTime: "15:00", status: "done" },
    { ...base, id: "d", title: "D", startTime: null, endTime: null },
  ] as Todo[];

  it("같은 날 시간이 겹치고 끝내지 않은 것만", () => {
    expect(overlapping(todos, { dateKey: TODAY, startTime: "15:00", endTime: "16:30" }).map((t) => t.id)).toEqual([
      "a",
      "b",
    ]);
    expect(overlapping(todos, { dateKey: TODAY, startTime: null, endTime: null })).toEqual([]);
    expect(overlapping(todos, { dateKey: "2026-11-04", startTime: "13:00", endTime: "14:00" })).toEqual([]);
  });
});

describe("nextOccurrences", () => {
  it("매일, 격주, 매월 마지막 화요일, 종료일", () => {
    expect(nextOccurrences({ unit: "day", interval: 1, until: null }, TODAY, 3)).toEqual([
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
    ]);
    expect(nextOccurrences({ unit: "week", interval: 2, until: null, weekdays: [1, 3] }, TODAY, 4)).toEqual([
      "2026-11-03",
      "2026-11-05",
      "2026-11-17",
      "2026-11-19",
    ]);
    expect(nextOccurrences({ unit: "month", interval: 1, until: null, monthWeek: -1 }, "2026-11-24", 2)).toEqual([
      "2026-11-24",
      "2026-12-29",
    ]);
    expect(nextOccurrences({ unit: "day", interval: 1, until: "2026-11-04" }, TODAY)).toEqual([
      "2026-11-03",
      "2026-11-04",
    ]);
  });
});
