import { registerRightPanelTab } from "@/widgets/app-shell";
import { isServerFeatureOn } from "@/shared/lib/serverFeatures";
import { isDemoMode } from "@/shared/lib/demoMode";
import { SuggestionsTab } from "./ui/SuggestionsTab";

let done = false;

export function registerAiSuggestionsTab(): void {
  if (done) return;
  done = true;
  registerRightPanelTab("ai", {
    labelKey: "ai.sug.tabLabel",
    visible: () => isServerFeatureOn("ai", { demo: isDemoMode() }),
    render: () => <SuggestionsTab />,
  });
}
