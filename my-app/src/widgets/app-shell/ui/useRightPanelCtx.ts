import { useSyncExternalStore } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { canUseGithub } from "@/shared/lib/permissions";
import { getRightPanelTabsVersion, subscribeRightPanelTabs, type RightPanelContext } from "../model/rightPanel";
import { useShell } from "../model/shellSlots";

/** 탭 보이기 판단에 쓰는 문맥. 등록이 바뀌면 다시 그린다. */
export function useRightPanelContext(): RightPanelContext {
  useSyncExternalStore(subscribeRightPanelTabs, getRightPanelTabsVersion, getRightPanelTabsVersion);
  const { route } = useShell();
  const { state } = useArchiveApp();
  return { route, githubOn: canUseGithub(state.github) };
}
