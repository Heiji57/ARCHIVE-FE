/**
 * 사용자 캘린더(개인, 팀, 스터디). 서버에 아직 없어(`useServerFeature("userCalendars")`) 데모에서만 보인다.
 * 목록은 TodoEditorProvider 의 `calendars` 로 받는다(Task 3 이 `entities/calendar/model/demo.ts` 로 넘길 자리).
 * 받지 않으면 아래 임시 목록을 쓴다.
 */
export interface EditorCalendar {
  id: string;
  name: string;
  /** CSS 색 값(토큰 `var(--...)`). */
  color: string;
  isDefault?: boolean;
}

export const FALLBACK_CALENDARS: EditorCalendar[] = [
  { id: "me", name: "개인", color: "var(--te-cal-me)", isDefault: true },
  { id: "team", name: "ARCHIVE 팀", color: "var(--te-cal-team)" },
  { id: "study", name: "스터디", color: "var(--te-cal-study)" },
];

export function defaultCalendar(list: EditorCalendar[]): EditorCalendar {
  return list.find((c) => c.isDefault) ?? list[0];
}
