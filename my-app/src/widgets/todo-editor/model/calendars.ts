/**
 * 사용자 캘린더(개인, 팀, 스터디). 서버에 아직 없어(`useServerFeature("userCalendars")`) 데모에서만 보인다.
 * 목록은 TodoEditorProvider 의 `calendars` 로 받는다(App 의 TodoEditorHost 가 캘린더 사이드바와 같은 목록을 넘김).
 */
export interface EditorCalendar {
  id: string;
  name: string;
  /** CSS 색 값(토큰 `var(--cal-c1..c8)`). */
  color: string;
  isDefault?: boolean;
}

/** 기본 캘린더(없으면 첫 캘린더, 목록이 비면 undefined). */
export function defaultCalendar(list: EditorCalendar[]): EditorCalendar | undefined {
  return list.find((c) => c.isDefault) ?? list[0];
}
