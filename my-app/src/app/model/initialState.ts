import { seedState } from "@/app/config/seedState";
import { loadAppState } from "@/app/lib/storage";
import type { AppState } from "@/app/model/types";

export function getInitialAppState(): AppState {
  const persisted = loadAppState(seedState);

  return {
    ...persisted,
    notifications: [],
  };
}
