import { seedState } from "@/app/config/seedState";
import { loadAppState } from "@/app/lib/storage";
import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { AppState, PersistedAppState } from "@/app/model/types";
import { INITIAL_GITHUB_STATE } from "@/entities/github/model/types";
import { DEFAULT_ACTIVE_TEMPLATE_IDS, DEFAULT_TEMPLATES } from "@/entities/template";

export function getInitialAppState(): AppState {
  const fallback: PersistedAppState = {
    ...seedState,
    notifications: seedState.notifications ?? [],
    settings: seedState.settings ?? { ...DEFAULT_SETTINGS },
    pendingSummary: seedState.pendingSummary ?? null,
    templates: seedState.templates ?? DEFAULT_TEMPLATES,
    activeTemplateIds:
      seedState.activeTemplateIds ?? DEFAULT_ACTIVE_TEMPLATE_IDS,
  };
  // GitHub 상태는 영속화하지 않음(서버/세션 기반) → 항상 초기값으로 시작.
  return { ...loadAppState(fallback), github: INITIAL_GITHUB_STATE };
}
