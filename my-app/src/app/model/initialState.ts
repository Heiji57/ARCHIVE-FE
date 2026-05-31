import { seedState } from "@/app/config/seedState";
import { loadAppState } from "@/app/lib/storage";
import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { AppState, PersistedAppState } from "@/app/model/types";
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
  return loadAppState(fallback);
}
