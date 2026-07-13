import { useEffect } from "react";
import { isDemoMode } from "@/app/config/demo";
import { saveAppState } from "@/app/lib/storage";
import type { AppState } from "@/app/model/types";
import { USE_API } from "@/shared/api";

export function usePersistAppState(state: AppState) {
  useEffect(() => {
    // API 모드에서는 서버가 SoT — localStorage 저장을 건너뛴다.
    // (currentUser/rememberMe 등 세션 상태도 토큰 기반이므로 저장 불필요)
    // 데모 모드는 일회성 체험 — localStorage 를 오염시키지 않는다.
    if (USE_API || isDemoMode()) return;
    saveAppState({
      todos: state.todos,
      entries: state.entries,
      folders: state.folders,
      notifications: state.notifications,
      settings: state.settings,
      pendingSummary: state.pendingSummary,
      currentUser: state.currentUser,
      rememberMe: state.rememberMe,
      templates: state.templates,
      activeTemplateIds: state.activeTemplateIds,
    });
  }, [
    state.entries,
    state.folders,
    state.todos,
    state.notifications,
    state.settings,
    state.pendingSummary,
    state.currentUser,
    state.rememberMe,
    state.templates,
    state.activeTemplateIds,
  ]);
}
