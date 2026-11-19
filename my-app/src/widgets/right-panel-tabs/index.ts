import { registerPanelTabs } from "./register";

// 불러오면 셸 오른쪽 패널에 탭 5개를 등록한다(캘린더, 할 일 화면이 import).
registerPanelTabs();

export { usePanelDate, usePanelDateSync } from "./model/panelDate";
export { useDayCommits, commitTime, repoName } from "./model/useDayCommits";
export { dayProgress, freeSlot, untimedOn, type DayProgress } from "./model/dayProgress";
export { dueBand, dueTag, type DueBandDay } from "./model/dueBand";
