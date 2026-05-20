import { useEffect } from "react";
import { saveAppState } from "@/app/lib/storage";
import type { AppState } from "@/app/model/types";

export function usePersistAppState(state: AppState) {
  useEffect(() => {
    saveAppState({
      todos: state.todos,
      entries: state.entries,
      githubConfig: state.githubConfig,
      notifications: state.notifications,
      settings: state.settings,
      pendingSummary: state.pendingSummary,
    });
  }, [
    state.entries,
    state.githubConfig,
    state.todos,
    state.notifications,
    state.settings,
    state.pendingSummary,
  ]);
}
