import { describe, expect, it } from "vitest";
import { todo } from "@/widgets/right-panel-tabs/model/testTodo";
import { carryCandidates, carryDays, carryNotes, carryPlan } from "./carryPlan";

const DAY = "2026-11-03";
const TODOS = [
  todo({ id: "done", status: "done" }),
  todo({ id: "doing", status: "in-progress", startTime: "13:00", endTime: "15:30" }),
  todo({ id: "a" }),
  todo({ id: "b" }),
  todo({ id: "c" }),
  todo({ id: "rep", recurrenceRule: { unit: "day", interval: 1, until: null } }),
  todo({ id: "virt", isVirtual: true, seriesId: "s1" }),
  todo({ id: "span", dateKey: "2026-11-01", dueDate: "2026-11-05" }),
  todo({ id: "other", dateKey: "2026-11-04" }),
];

describe("carryCandidates", () => {
  it("그날 끝내지 않은 할 일(반복, 기간 할 일 제외)", () => {
    expect(carryCandidates(TODOS, DAY).map((t) => t.id)).toEqual(["doing", "a", "b", "c"]);
  });
});

describe("carryPlan", () => {
  it("답하지 않은 일은 내일로, 끝낸 것과 반복 할 일은 그대로", () => {
    const plan = carryPlan(TODOS, DAY, {});
    expect(plan).toEqual([
      { id: "doing", patch: { dateKey: "2026-11-04" } },
      { id: "a", patch: { dateKey: "2026-11-04" } },
      { id: "b", patch: { dateKey: "2026-11-04" } },
      { id: "c", patch: { dateKey: "2026-11-04" } },
    ]);
  });

  it("다른 날, 오늘에 두기, 이미 끝냄", () => {
    const plan = carryPlan(TODOS, DAY, {
      doing: { kind: "move", dateKey: "2026-11-06" },
      a: { kind: "keep" },
      b: { kind: "done" },
      rep: { kind: "move", dateKey: "2026-11-04" },
    });
    expect(plan).toEqual([
      { id: "doing", patch: { dateKey: "2026-11-06" } },
      { id: "b", patch: { status: "done" } },
      { id: "c", patch: { dateKey: "2026-11-04" } },
    ]);
  });
});

describe("carryDays", () => {
  it("화요일: 내일, 모레, 금요일, 다음 주 월요일", () => {
    expect(carryDays(DAY)).toEqual({
      tomorrow: "2026-11-04",
      later: ["2026-11-05", "2026-11-06", "2026-11-09"],
    });
  });

  it("겹치는 날은 한 번만(일요일: 다음 주 월요일 = 내일)", () => {
    expect(carryDays("2026-11-08")).toEqual({
      tomorrow: "2026-11-09",
      later: ["2026-11-10", "2026-11-11"],
    });
  });
});

describe("carryNotes", () => {
  it("Google 일정과 마감", () => {
    const g = todo({ id: "g", calendarLinked: true, dueDate: "2026-11-03" });
    expect(carryNotes(g, "2026-11-04", DAY)).toEqual([
      { tone: "late", kind: "duePassed", due: "2026-11-03" },
      { tone: "", kind: "gcal" },
    ]);
    expect(carryNotes(g, null, DAY)).toEqual([{ tone: "soon", kind: "dueToday" }]);
  });
});
