import type { Todo } from "@/entities/todo/model/types";
import type { TranslationKey } from "@/shared/lib/i18n";

/** Drag kind for the cell-to-cell DnD on the calendar. */
export const TODO_DRAG_KIND = "todo";

/** Calendar day-of-week translation keys (Sun → Sat). */
export const DAY_ABBR_KEYS: TranslationKey[] = [
  "calendar.days.sun",
  "calendar.days.mon",
  "calendar.days.tue",
  "calendar.days.wed",
  "calendar.days.thu",
  "calendar.days.fri",
  "calendar.days.sat",
];

export const DAY_FULL_KEYS: TranslationKey[] = [
  "calendar.days.sunday",
  "calendar.days.monday",
  "calendar.days.tuesday",
  "calendar.days.wednesday",
  "calendar.days.thursday",
  "calendar.days.friday",
  "calendar.days.saturday",
];

/** Patch shape for inline todo edits from the calendar detail panel. */
export type TodoPatch = Partial<
  Pick<Todo, "title" | "status" | "description" | "dateKey">
>;
