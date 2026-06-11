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

