import { afterEach, describe, expect, it } from "vitest";
import {
  RIGHT_PANEL_TABS,
  getRightPanelTabDef,
  listRowTabs,
  registerRightPanelTab,
  resolveActiveTab,
  subscribeRightPanelTabs,
} from "./rightPanel";

const cal = { route: "calendar", githubOn: true } as const;
const todos = { route: "todos", githubOn: true } as const;

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe("오른쪽 패널 탭", () => {
  it("탭 순서는 시안 순서", () => {
    expect(RIGHT_PANEL_TABS).toEqual(["day", "timeline", "unscheduled", "due", "commits", "ai"]);
  });

  it("기본 탭: 캘린더는 하루, 시간 미정, 마감, 커밋", () => {
    expect(listRowTabs(cal)).toEqual(["day", "unscheduled", "due", "commits"]);
  });

  it("할 일 화면에는 시간표 탭이 더 있다", () => {
    expect(listRowTabs(todos)).toEqual(["day", "timeline", "unscheduled", "due", "commits"]);
  });

  it("GitHub 연결 전에는 커밋 탭이 없다", () => {
    expect(listRowTabs({ route: "calendar", githubOn: false })).not.toContain("commits");
  });

  it("ai 탭은 등록해도 탭 글자 줄에는 없다(오른쪽 줄 버튼으로 연다)", () => {
    cleanups.push(registerRightPanelTab("ai", { labelKey: "nav.calendar", render: () => null }));
    expect(getRightPanelTabDef("ai")).toBeDefined();
    expect(listRowTabs(cal)).not.toContain("ai");
  });

  it("다시 등록하면 덮어쓰고, 해제하면 기본 정의로 돌아간다", () => {
    const before = getRightPanelTabDef("due");
    const off = registerRightPanelTab("due", { labelKey: "nav.todos", render: () => "x", visible: () => false });
    expect(getRightPanelTabDef("due")?.labelKey).toBe("nav.todos");
    expect(listRowTabs(cal)).not.toContain("due");
    off();
    expect(getRightPanelTabDef("due")).toBe(before);
  });

  it("등록하면 구독자에게 알린다", () => {
    let n = 0;
    cleanups.push(subscribeRightPanelTabs(() => n++));
    cleanups.push(registerRightPanelTab("ai", { labelKey: "nav.calendar", render: () => null }));
    expect(n).toBe(1);
  });

  it("지금 탭이 보이지 않으면 첫 탭으로", () => {
    expect(resolveActiveTab("timeline", cal)).toBe("day");
    expect(resolveActiveTab("due", cal)).toBe("due");
  });

  it("ai 탭은 등록돼 있고 보일 때만 유지", () => {
    expect(resolveActiveTab("ai", cal)).toBe("day");
    cleanups.push(registerRightPanelTab("ai", { labelKey: "nav.calendar", render: () => null }));
    expect(resolveActiveTab("ai", cal)).toBe("ai");
  });
});

describe("오른쪽 줄 추가 버튼", () => {
  it("order 순으로, visible 이 false 면 빼고", async () => {
    const { registerRightRailItem, listRightRailItems } = await import("./rightPanel");
    cleanups.push(registerRightRailItem("b", { order: 20, render: () => null }));
    cleanups.push(registerRightRailItem("a", { order: 10, render: () => null }));
    cleanups.push(registerRightRailItem("h", { order: 5, render: () => null, visible: () => false }));
    expect(listRightRailItems(cal).map((x) => x.id)).toEqual(["a", "b"]);
  });
});
