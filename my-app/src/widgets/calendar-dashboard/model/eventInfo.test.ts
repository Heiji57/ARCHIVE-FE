import { describe, expect, it } from "vitest";
import type { Todo } from "@/entities/todo/model/types";
import {
  addDaysKey,
  daysBetween,
  dueInfo,
  durationLabel,
  formatClock,
  formatRange,
  isMultiDay,
  spanHeat,
} from "./eventInfo";

const todo = (p: Partial<Todo>): Todo => ({
  id: "x",
  title: "t",
  completed: false,
  dateKey: "2026-11-03",
  createdAt: "",
  status: "not-start",
  description: "",
  calendarLinked: false,
  calendarPushStatus: null,
  isVirtual: false,
  seriesId: null,
  originalDateKey: null,
  recurrenceRule: null,
  tags: [],
  ...p,
});

describe("날짜 계산", () => {
  it("daysBetween / addDaysKey", () => {
    expect(daysBetween("2026-11-03", "2026-11-07")).toBe(4);
    expect(daysBetween("2026-11-03", "2026-10-31")).toBe(-3);
    expect(addDaysKey("2026-10-30", 3)).toBe("2026-11-02");
  });

  it("isMultiDay: 마감이 시작과 다른 날일 때만", () => {
    expect(isMultiDay(todo({ dueDate: "2026-11-07" }))).toBe(true);
    expect(isMultiDay(todo({ dueDate: "2026-11-03" }))).toBe(false);
    expect(isMultiDay(todo({ dueDate: null }))).toBe(false);
  });
});

describe("dueInfo: D-N / 오늘 마감 / N일 지남 / 완료", () => {
  const t = todo({ dateKey: "2026-11-04", dueDate: "2026-11-07" });
  it("남은 날", () => {
    expect(dueInfo(t, "2026-11-03")).toEqual({ kind: "left", days: 4, tone: "" });
    expect(dueInfo(t, "2026-11-05")).toEqual({ kind: "left", days: 2, tone: "soon" });
  });
  it("오늘 마감과 지남", () => {
    expect(dueInfo(t, "2026-11-07")).toEqual({ kind: "today", days: 0, tone: "soon" });
    expect(dueInfo(t, "2026-11-10")).toEqual({ kind: "late", days: 3, tone: "late" });
  });
  it("완료면 날짜와 상관없이 완료", () => {
    expect(dueInfo({ ...t, status: "done" }, "2026-11-10")).toEqual({ kind: "done", days: 0, tone: "ok" });
  });
});

describe("spanHeat: 마감에 가까울수록 진하게", () => {
  const t = todo({ dateKey: "2026-11-04", dueDate: "2026-11-07" });
  it("7일 이상 남으면 16%, 당일 46%, 지나면 46% + 빗금, 완료 12%", () => {
    expect(spanHeat(todo({ dateKey: "2026-11-01", dueDate: "2026-11-20" }), "2026-11-03")).toEqual({ pct: 16, late: false, done: false });
    expect(spanHeat(t, "2026-11-07")).toEqual({ pct: 46, late: false, done: false });
    expect(spanHeat(t, "2026-11-09")).toEqual({ pct: 46, late: true, done: false });
    expect(spanHeat({ ...t, status: "done" }, "2026-11-09")).toEqual({ pct: 12, late: false, done: true });
  });
  it("4일 남으면 46 - 4/7*30 반올림", () => {
    expect(spanHeat(t, "2026-11-03").pct).toBe(Math.round(46 - (4 / 7) * 30));
  });
});

describe("시각 표시", () => {
  it("formatClock: 12시간제, 짧게는 분 생략", () => {
    expect(formatClock(9 * 60)).toBe("9:00 AM");
    expect(formatClock(13 * 60 + 30)).toBe("1:30 PM");
    expect(formatClock(0)).toBe("12:00 AM");
    expect(formatClock(14 * 60, true)).toBe("2 PM");
    expect(formatClock(14 * 60 + 20, true)).toBe("2:20 PM");
  });
  it("formatRange: 오전·오후가 같으면 한 번만", () => {
    expect(formatRange(9 * 60, 10 * 60 + 30)).toBe("9:00 ~ 10:30 AM");
    expect(formatRange(11 * 60, 12 * 60)).toBe("11:00 AM ~ 12:00 PM");
    expect(formatRange(13 * 60, 15 * 60 + 30)).toBe("1:00 ~ 3:30 PM");
  });
  it("durationLabel", () => {
    expect(durationLabel(90)).toBe("1h 30m");
    expect(durationLabel(60)).toBe("1h");
    expect(durationLabel(30)).toBe("30m");
  });
});
