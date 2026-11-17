import { describe, expect, it } from "vitest";
import { hourOf, niceHours, stepTime, weekOrder, workSummary } from "./workHours";

describe("workHours", () => {
  it("hourOf 는 HH:mm 을 시간(소수)으로", () => {
    expect(hourOf("09:00")).toBe(9);
    expect(hourOf("18:30")).toBe(18.5);
  });

  it("weekOrder 는 주 시작 요일부터 7일 (0=일)", () => {
    expect(weekOrder("mon")).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekOrder("sun")).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("stepTime 은 30분씩 움직이고 0~24 안에 머문다", () => {
    expect(stepTime("09:00", 0.5)).toBe("09:30");
    expect(stepTime("09:30", -0.5)).toBe("09:00");
    expect(stepTime("00:00", -0.5)).toBe("00:00");
    expect(stepTime("23:30", 0.5)).toBe("24:00");
  });

  it("workSummary 는 일하는 날 수, 하루 시간, 한 주 시간", () => {
    expect(workSummary([1, 2, 3, 4, 5], "09:00", "18:00")).toEqual({ days: 5, perDay: 9, total: 45 });
    expect(workSummary([], "09:00", "18:00")).toEqual({ days: 0, perDay: 9, total: 0 });
    expect(workSummary([1], "18:00", "09:00")).toEqual({ days: 1, perDay: 0, total: 0 });
  });

  it("niceHours 는 정수면 그대로, 아니면 소수 한 자리", () => {
    expect(niceHours(9)).toBe("9");
    expect(niceHours(8.5)).toBe("8.5");
  });
});
