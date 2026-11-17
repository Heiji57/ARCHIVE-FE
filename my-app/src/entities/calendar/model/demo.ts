import type { UserCalendar } from "./types";

/**
 * 데모 모드 사용자 캘린더(시안 planner.js A.cals). 데모 모드에서만 읽는다.
 * 실제 모드에는 사용자 캘린더 API 가 없어 쓰지 않는다.
 */
export const DEMO_USER_CALENDARS: readonly UserCalendar[] = [
  { id: "me", name: "개인", color: "c7", isDefault: true },
  { id: "team", name: "ARCHIVE 팀", color: "c2", isDefault: false },
  { id: "study", name: "스터디", color: "c3", isDefault: false },
];

/**
 * 데모 할 일이 든 캘린더(시안: 첫 태그가 업무면 팀, 학습이면 스터디, 나머지는 개인. 월간 예시는 지정값).
 * 여기 없는 할 일(데모에서 새로 만든 것)은 기본 캘린더에 든다.
 */
export const DEMO_TODO_CALENDAR: Readonly<Record<string, string>> = {
  "demo-t1": "team",
  "demo-t2": "team",
  "demo-t3": "team",
  "demo-t4": "me",
  "demo-t5": "study",
  "demo-t6": "team",
  "demo-t7": "team",
  "demo-t8": "me",
  "demo-t9": "team",
  "demo-t10": "team",
  "demo-t11": "team",
  "demo-t12": "team",
  "demo-t13": "me",
  "demo-t14": "study",
  "demo-m1": "team",
  "demo-m2": "team",
  "demo-m3": "study",
  "demo-m4": "team",
  "demo-m5": "team",
  "demo-m6": "me",
  "demo-m7": "team",
  "demo-m8": "team",
  "demo-m9": "study",
  "demo-m10": "me",
  "demo-m11": "team",
  "demo-m12": "me",
};
