import type { PersistedAppState } from "@/app/model/types";

const STORAGE_KEY = "archive-app-state-v3";

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
      githubConfig: parsed.githubConfig ?? fallback.githubConfig,
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
