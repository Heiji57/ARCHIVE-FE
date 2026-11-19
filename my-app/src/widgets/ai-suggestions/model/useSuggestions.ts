import { useCallback, useEffect, useState } from "react";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { isDemoMode } from "@/shared/lib/demoMode";
import { setCalendarOverlay } from "@/widgets/calendar-dashboard";
import { DEMO_SUGGESTIONS, type AiSuggestion } from "./demoSuggestions";
import type { Todo } from "@/entities/todo/model/types";

const OVERLAY_ID = "ai-suggestions";

function suggestionToTodo(s: AiSuggestion): Todo {
  return {
    id: `sug-${s.id}`,
    title: s.title,
    completed: false,
    dateKey: s.dateKey,
    createdAt: new Date().toISOString(),
    completedAt: null,
    status: "not-start",
    description: s.reason,
    startTime: s.startTime,
    endTime: s.endTime,
    calendarLinked: false,
    calendarPushStatus: null,
    isVirtual: true,
    seriesId: null,
    originalDateKey: null,
    recurrenceRule: null,
    tags: [],
    dueDate: null,
  };
}

export interface SuggestionsState {
  items: readonly AiSuggestion[];
  applied: Set<string>;
  dismissed: Set<string>;
}

export function useSuggestions(open: boolean) {
  const aiOn = useServerFeature("ai");
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const items = isDemoMode() ? DEMO_SUGGESTIONS : [];
  const visible = items.filter((s) => !dismissed.has(s.id));

  useEffect(() => {
    if (!aiOn || !open) {
      setCalendarOverlay(OVERLAY_ID, null);
      return;
    }
    const overlayItems = visible
      .filter((s) => !applied.has(s.id))
      .map((s) => ({ key: s.id, todo: suggestionToTodo(s) }));
    setCalendarOverlay(OVERLAY_ID, overlayItems);
    return () => {
      setCalendarOverlay(OVERLAY_ID, null);
    };
  }, [aiOn, open, visible, applied]);

  const apply = useCallback((id: string) => {
    setApplied((prev) => new Set([...prev, id]));
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  }, []);

  return { items: visible, applied, aiOn, apply, dismiss };
}
