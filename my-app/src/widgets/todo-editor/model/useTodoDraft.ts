import { useState } from "react";
import type { TaskStatus } from "@/entities/todo/model/types";
import type { TodoEditorDefaults } from "./useTodoEditor";

/** 새 할 일 창(3번)이 만드는 할 일. 추가를 누르기 전까지는 이 창 안에만 있다. */
export interface TodoDraft {
  title: string;
  dateKey: string;
  startTime: string | null;
  endTime: string | null;
  dueDate: string | null;
  tags: string[];
  status: TaskStatus;
  description: string;
  calendarId: string;
}

export function draftFromDefaults(
  defaults: Partial<TodoEditorDefaults>,
  today: string,
  calendarId: string,
): TodoDraft {
  return {
    title: "",
    dateKey: defaults.dateKey ?? today,
    startTime: defaults.startTime ?? null,
    endTime: defaults.startTime ? (defaults.endTime ?? null) : null,
    dueDate: null,
    tags: [],
    status: "not-start",
    description: "",
    calendarId,
  };
}

/** 날짜를 마감일 뒤로 옮기면 마감일을 지운다(마감일은 할 날 이후만). */
export function applyDraftPatch(draft: TodoDraft, patch: Partial<TodoDraft>): TodoDraft {
  const next = { ...draft, ...patch };
  if (next.dueDate && next.dueDate < next.dateKey) next.dueDate = null;
  return next;
}

export function useTodoDraft(init: () => TodoDraft): [TodoDraft, (patch: Partial<TodoDraft>) => void] {
  const [draft, setDraft] = useState(init);
  return [draft, (patch) => setDraft((d) => applyDraftPatch(d, patch))];
}
