import { describe, expect, it } from "vitest";
import { toDateKey } from "@/shared/lib/date";
import { monthGridStart, weekDays, weekStartOf } from "./weekDays";

const keys = (ds: Date[]) => ds.map(toDateKey);

describe("weekDays", () => {
  it("일요일 시작: 2026-11-03(화) → 11/1 ~ 11/7", () => {
    expect(keys(weekDays(new Date(2026, 10, 3), "sun"))).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
    ]);
  });

  it("월요일 시작: 2026-11-03(화) → 11/2 ~ 11/8", () => {
    const d = keys(weekDays(new Date(2026, 10, 3), "mon"));
    expect(d[0]).toBe("2026-11-02");
    expect(d[6]).toBe("2026-11-08");
  });

  it("주 시작 요일 당일이면 그 날부터", () => {
    expect(keys(weekDays(new Date(2026, 10, 1), "sun"))[0]).toBe("2026-11-01");
    expect(keys(weekDays(new Date(2026, 10, 1), "mon"))[0]).toBe("2026-10-26");
    expect(keys(weekDays(new Date(2026, 10, 2), "mon"))[0]).toBe("2026-11-02");
  });

  it("월 경계를 넘는 주", () => {
    expect(keys(weekDays(new Date(2026, 9, 30), "sun"))).toEqual([
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
    ]);
    expect(keys(weekDays(new Date(2026, 11, 31), "mon"))).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  it("weekStartOf 는 dateKey 로도 같은 결과", () => {
    expect(weekStartOf("2026-11-03", "sun")).toBe("2026-11-01");
    expect(weekStartOf("2026-11-08", "mon")).toBe("2026-11-02");
  });

  it("monthGridStart: 그 달 1일이 든 주의 첫날", () => {
    expect(monthGridStart("2026-11-17", "sun")).toBe("2026-11-01");
    expect(monthGridStart("2026-11-17", "mon")).toBe("2026-10-26");
    expect(monthGridStart("2026-12-05", "sun")).toBe("2026-11-29");
  });
});
