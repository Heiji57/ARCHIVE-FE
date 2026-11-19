import { describe, expect, it } from "vitest";
import { todo } from "@/widgets/right-panel-tabs/model/testTodo";
import { onColumn, sortDay } from "./sortDay";

describe("sortDay", () => {
  it("기간 할 일이 위(마감 늦은 것부터), 그다음 시작 시각, 시간 미정은 아래", () => {
    const l = sortDay([
      todo({ id: "free" }),
      todo({ id: "pm", startTime: "13:00" }),
      todo({ id: "am", startTime: "09:00" }),
      todo({ id: "sp1", dateKey: "2026-11-01", dueDate: "2026-11-05" }),
      todo({ id: "sp2", dateKey: "2026-11-02", dueDate: "2026-11-07" }),
    ]);
    expect(l.map((x) => x.id)).toEqual(["sp2", "sp1", "am", "pm", "free"]);
  });
});

describe("onColumn", () => {
  it("기간 할 일은 시작부터 마감까지 열마다", () => {
    const sp = todo({ id: "sp", dateKey: "2026-11-04", dueDate: "2026-11-07" });
    expect(["2026-11-03", "2026-11-04", "2026-11-07", "2026-11-08"].map((d) => onColumn(sp, d))).toEqual([
      false,
      true,
      true,
      false,
    ]);
    expect(onColumn(todo({ id: "a" }), "2026-11-03")).toBe(true);
  });
});
