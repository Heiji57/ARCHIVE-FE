import { describe, expect, it } from "vitest";
import { dueBand, dueCount, dueTag } from "./dueBand";
import { todo } from "./testTodo";

const TODAY = "2026-11-03";
const TODOS = [
  todo({ id: "late", dateKey: "2026-10-31", dueDate: "2026-11-02" }),
  todo({ id: "today", dateKey: "2026-11-01", dueDate: "2026-11-03" }),
  todo({ id: "d6", dateKey: "2026-11-04", dueDate: "2026-11-09" }),
  todo({ id: "d7", dateKey: "2026-11-04", dueDate: "2026-11-10" }),
  todo({ id: "done", dateKey: "2026-10-30", dueDate: "2026-11-01", status: "done" }),
  todo({ id: "none" }),
];

describe("dueBand", () => {
  it("지난 마감이 맨 앞, 그 뒤로 오늘부터 7일", () => {
    const b = dueBand(TODOS, TODAY);
    expect(b[0]).toMatchObject({ dateKey: null, overdue: true });
    expect(b[0].todos.map((t) => t.id)).toEqual(["late"]);
    expect(b.slice(1).map((x) => x.dateKey)).toEqual([
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
    ]);
    expect(b[1].todos.map((t) => t.id)).toEqual(["today"]);
    expect(b[7].todos.map((t) => t.id)).toEqual(["d6"]);
  });

  it("7일 경계 밖(8일째)과 끝낸 일, 마감 없는 일은 없다", () => {
    const ids = dueBand(TODOS, TODAY).flatMap((x) => x.todos.map((t) => t.id));
    expect(ids).not.toContain("d7");
    expect(ids).not.toContain("done");
    expect(ids).not.toContain("none");
    expect(dueCount(TODOS, TODAY)).toBe(3);
  });

  it("지난 마감이 없으면 지남 칸이 없다", () => {
    const b = dueBand([todo({ id: "a", dueDate: "2026-11-05", dateKey: "2026-11-01" })], TODAY);
    expect(b).toHaveLength(7);
    expect(b[0].overdue).toBe(false);
  });

  it("D 표시", () => {
    expect(dueTag("2026-11-02", TODAY)).toEqual({ label: "D+1", tone: "late" });
    expect(dueTag("2026-11-03", TODAY)).toEqual({ label: "D-day", tone: "soon" });
    expect(dueTag("2026-11-04", TODAY)).toEqual({ label: "D-1", tone: "soon" });
    expect(dueTag("2026-11-07", TODAY)).toEqual({ label: "D-4", tone: "" });
  });
});
