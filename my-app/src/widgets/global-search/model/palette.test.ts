import { describe, expect, it } from "vitest";
import { buildPaletteGroups, cyclePaletteTab, relativeDay } from "./palette";

const todo = (id: string, dateKey: string, title = id) => ({ id, dateKey, title });
const entry = (id: string, dateKey: string, title = id) => ({ id, dateKey, title });
const cmd = (id: string, label: string) => ({ id, label });

const TODAY = "2026-11-03";
const todos = [todo("a", "2026-10-01"), todo("b", "2026-11-03"), todo("c", "2026-11-05"), todo("d", "2026-11-02"), todo("e", "2026-12-30")];
const entries = [entry("r1", "2026-10-30"), entry("r2", "2026-11-02"), entry("r3", "2026-11-01")];
const cmds = [cmd("new", "새 할 일"), cmd("settings", "설정 열기"), cmd("x3", "c3"), cmd("x4", "c4"), cmd("x5", "c5"), cmd("x6", "c6")];

describe("buildPaletteGroups", () => {
  it("검색어가 없으면 오늘에 가까운 할 일 3개, 최근 회고 2개, 명령 5개", () => {
    const g = buildPaletteGroups({ q: "", tab: "all", todos, entries, commands: cmds, today: TODAY });
    expect(g.map((x) => x.kind)).toEqual(["todo", "retro", "cmd"]);
    expect(g[0].items.map((x) => x.id)).toEqual(["b", "d", "c"]);
    expect(g[1].items.map((x) => x.id)).toEqual(["r2", "r3"]);
    expect(g[2].items).toHaveLength(5);
  });

  it("검색어가 있으면 받은 결과를 순서대로(할 일 6, 회고 4), 명령은 이름으로 거른다", () => {
    const many = Array.from({ length: 8 }, (_, i) => todo(`t${i}`, TODAY));
    const g = buildPaletteGroups({ q: "설정", tab: "all", todos: many, entries, commands: cmds, today: TODAY });
    expect(g[0].items).toHaveLength(6);
    expect(g[1].items.map((x) => x.id)).toEqual(["r1", "r2", "r3"]);
    expect(g[2].items.map((x) => x.id)).toEqual(["settings"]);
  });

  it("범위 탭이면 그 묶음만", () => {
    const g = buildPaletteGroups({ q: "", tab: "cmd", todos, entries, commands: cmds, today: TODAY });
    expect(g.map((x) => x.kind)).toEqual(["cmd"]);
  });

  it("빈 묶음은 빼고, 아무것도 없으면 빈 배열", () => {
    const g = buildPaletteGroups({ q: "zz", tab: "all", todos: [], entries: [], commands: cmds, today: TODAY });
    expect(g).toEqual([]);
  });

  it("날짜 없는 할 일은 검색어 없을 때 빼고 본다", () => {
    const g = buildPaletteGroups({ q: "", tab: "todo", todos: [todo("n", ""), todo("b", TODAY)], entries: [], commands: [], today: TODAY });
    expect(g[0].items.map((x) => x.id)).toEqual(["b"]);
  });
});

describe("cyclePaletteTab", () => {
  it("Tab 은 다음, Shift+Tab 은 이전, 끝에서 돈다", () => {
    expect(cyclePaletteTab("all", 1)).toBe("todo");
    expect(cyclePaletteTab("cmd", 1)).toBe("all");
    expect(cyclePaletteTab("all", -1)).toBe("cmd");
  });
});

describe("relativeDay", () => {
  it("오늘, 어제, 내일, 그 밖", () => {
    expect(relativeDay("2026-11-03", TODAY)).toBe("today");
    expect(relativeDay("2026-11-02", TODAY)).toBe("yesterday");
    expect(relativeDay("2026-11-04", TODAY)).toBe("tomorrow");
    expect(relativeDay("2026-12-01", TODAY)).toBeNull();
    expect(relativeDay("2026-03-01", "2026-02-28")).toBe("tomorrow");
  });
});
