import { createElement } from "react";
import { registerRightRailItem } from "@/widgets/app-shell";
import { CloseDayRailButton } from "./ui/CloseDayHost";

// 불러오면 오른쪽 줄에 "오늘 마무리" 버튼을 놓는다(캘린더, 할 일 화면).
registerRightRailItem("close-day", {
  order: 10,
  render: () => createElement(CloseDayRailButton),
  visible: (c) => c.route === "calendar" || c.route === "todos",
});

export { CloseDayHost } from "./ui/CloseDayHost";
export { closeDayActions, useCloseDayState } from "./model/closeDay";
export { carryPlan, carryCandidates, type CarryAnswer, type CarryAnswers, type CarryPatch } from "./model/carryPlan";
