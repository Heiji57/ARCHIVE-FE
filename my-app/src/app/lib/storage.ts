import { ensureSettings } from "@/app/model/reducer";
import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { PersistedAppState } from "@/app/model/types";
import { DEFAULT_ACTIVE_TEMPLATE_IDS, DEFAULT_TEMPLATES } from "@/entities/template";

const STORAGE_KEY = "archive-app-state-v5";

export function loadAppState(fallback: PersistedAppState): PersistedAppState {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;

    return {
      todos: Array.isArray(parsed.todos) ? parsed.todos : fallback.todos,
      entries: Array.isArray(parsed.entries)
        ? parsed.entries
        : fallback.entries,
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : fallback.notifications,
      settings: ensureSettings(parsed.settings ?? DEFAULT_SETTINGS),
      pendingSummary: parsed.pendingSummary ?? null,
      currentUser: parsed.currentUser ?? null,
      rememberMe: parsed.rememberMe ?? false,
      templates: Array.isArray(parsed.templates)
        ? parsed.templates
        : DEFAULT_TEMPLATES,
      activeTemplateIds: {
        ...DEFAULT_ACTIVE_TEMPLATE_IDS,
        ...(parsed.activeTemplateIds ?? {}),
      },
    };
  } catch {
    return fallback;
  }
}

export function saveAppState(state: PersistedAppState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
