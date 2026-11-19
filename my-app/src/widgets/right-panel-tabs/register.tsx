import { registerRightPanelTab } from "@/widgets/app-shell";
import { CommitsTab, useCommitCount } from "./ui/CommitsTab";
import { DayTab } from "./ui/DayTab";
import { DueTab, useDueSummary } from "./ui/DueTab";
import { TimelineTab } from "./ui/TimelineTab";
import { UnscheduledTab, useUnscheduledCount } from "./ui/UnscheduledTab";

/* 탭 숫자(0이면 숫자 없음, 시안과 같음) */
function useUnscheduledTabCount() {
  return useUnscheduledCount() || null;
}
function useDueTabCount() {
  return useDueSummary().n || null;
}
function useDueTabWarn() {
  return useDueSummary().late;
}
function useCommitTabCount() {
  return useCommitCount() || null;
}

let done = false;
/**
 * 오른쪽 패널 탭 5개(시안 rpanel.js 6번): 하루, 시간표(할 일 화면만), 시간 미정, 마감, 커밋(GitHub 연결 때만).
 * 셸이 미리 등록한 같은 이름의 빈 탭을 덮어쓴다. AI 추천(ai)은 Task 10.
 */
export function registerPanelTabs(): void {
  if (done) return;
  done = true;
  registerRightPanelTab("day", { labelKey: "shell.panel.tab.day", render: () => <DayTab /> });
  registerRightPanelTab("timeline", {
    labelKey: "shell.panel.tab.timeline",
    render: () => <TimelineTab />,
    visible: (c) => c.route === "todos",
  });
  registerRightPanelTab("unscheduled", {
    labelKey: "shell.panel.tab.unscheduled",
    count: useUnscheduledTabCount,
    render: () => <UnscheduledTab />,
  });
  registerRightPanelTab("due", {
    labelKey: "shell.panel.tab.due",
    count: useDueTabCount,
    countWarn: useDueTabWarn,
    render: () => <DueTab />,
  });
  registerRightPanelTab("commits", {
    labelKey: "shell.panel.tab.commits",
    count: useCommitTabCount,
    render: () => <CommitsTab />,
    visible: (c) => c.githubOn,
  });
}
