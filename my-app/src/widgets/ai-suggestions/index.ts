import { registerAiSuggestionsTab } from "./register.tsx";

// 불러오면 오른쪽 패널에 AI 추천 탭을 등록한다(캘린더, 할 일 화면이 import).
registerAiSuggestionsTab();

export { SuggestionsTab } from "./ui/SuggestionsTab";
