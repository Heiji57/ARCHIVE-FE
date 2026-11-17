import type { RecurrenceRule, TaskStatus, Todo } from "@/entities/todo/model/types";

/**
 * 데모(그리고 서버 없는 mock 모드)의 시작 할 일. 시안(prototypes/linear-shell/shared/shared.js A.todos,
 * planner.js 월간 예시 m1~m12, sidevar.js·rpanel.js 의 예시 덧붙임)과 같은 제목, 날짜, 시간, 상태, 태그.
 * 기준일은 DEMO_ANCHOR_DATE_KEY(2026-11-03, 화요일).
 *
 * 시안과 다른 점(서비스 모델에 맞춤):
 * - 날짜 없는 "배치 대기"가 없어서 문서 정리, 설정 화면 QA 는 그날의 시간 미정 할 일, BE 요청 문서 초안은
 *   10/31 시작 11/2 마감(지난 마감)으로 둔다(시안 rpanel.js 와 같음).
 * - 시안의 마감(due)과 기간 끝(until)은 서비스에서 dueDate 하나다. 기간 할 일(until)만 dueDate 로 옮기고,
 *   i18n 문구 점검의 마감(11/4)은 옮기지 않는다(옮기면 4시 블록이 기간 막대로 바뀐다).
 * - 할 일이 든 사용자 캘린더는 entities/calendar/model/demo.ts(DEMO_TODO_CALENDAR).
 */
type Seed = {
  id: string;
  title: string;
  status: TaskStatus;
  date: string;
  start?: string;
  end?: string;
  tags: string[];
  due?: string;
  note?: string;
  gcal?: "synced" | "failed";
  rule?: RecurrenceRule;
};

const SEEDS: Seed[] = [
  { id: "t1", title: "PR #14 코드 리뷰", status: "done", date: "2026-11-03", start: "09:00", end: "10:30", tags: ["업무", "리뷰"] },
  { id: "t2", title: "스프린트 회의", status: "done", date: "2026-11-03", start: "11:00", end: "12:00", tags: ["업무"] },
  {
    id: "t3",
    title: "캘린더 드래그 버그 수정",
    status: "in-progress",
    date: "2026-11-03",
    start: "13:00",
    end: "15:30",
    tags: ["업무", "버그"],
    note: "주 경계에서 dueDate가 안 밀리는 케이스 확인",
    gcal: "synced",
  },
  { id: "t4", title: "i18n 문구 점검", status: "not-start", date: "2026-11-03", start: "16:00", end: "17:00", tags: ["사이드"] },
  {
    id: "t5",
    title: "일일 회고 작성",
    status: "not-start",
    date: "2026-11-03",
    start: "18:00",
    end: "19:00",
    tags: ["학습"],
    rule: { unit: "day", interval: 1, until: null },
  },
  { id: "t6", title: "문서 정리", status: "not-start", date: "2026-11-03", tags: ["업무"] },
  { id: "t7", title: "설정 화면 QA", status: "not-start", date: "2026-11-03", tags: ["업무"] },
  { id: "t8", title: "BE 요청 문서 초안", status: "not-start", date: "2026-10-31", due: "2026-11-02", tags: ["사이드"] },
  { id: "t9", title: "주간 계획 세우기", status: "done", date: "2026-11-02", start: "10:00", end: "11:00", tags: ["업무"] },
  { id: "t10", title: "로그인 이슈 재현", status: "done", date: "2026-11-02", start: "14:00", end: "16:00", tags: ["업무"] },
  {
    id: "t11",
    title: "디자인 리뷰",
    status: "not-start",
    date: "2026-11-04",
    start: "15:00",
    end: "16:00",
    tags: ["업무", "리뷰"],
    gcal: "failed",
  },
  { id: "t12", title: "릴리스 점검", status: "not-start", date: "2026-11-05", start: "10:00", end: "12:00", tags: ["업무"] },
  { id: "t13", title: "리팩터링 스프린트", status: "in-progress", date: "2026-11-04", due: "2026-11-07", tags: ["사이드", "버그"] },
  { id: "t14", title: "영어 스터디", status: "not-start", date: "2026-11-06", start: "19:00", end: "20:00", tags: ["학습"] },
  { id: "m1", title: "스프린트 회고", status: "not-start", date: "2026-11-09", start: "10:00", end: "11:00", tags: ["업무"] },
  { id: "m2", title: "API 계약 리뷰", status: "not-start", date: "2026-11-09", start: "14:00", end: "15:30", tags: ["업무", "리뷰"] },
  { id: "m3", title: "알고리즘 스터디", status: "not-start", date: "2026-11-10", start: "20:00", end: "21:30", tags: ["학습"] },
  { id: "m4", title: "온보딩 문서 개편", status: "not-start", date: "2026-11-10", due: "2026-11-13", tags: ["업무"] },
  { id: "m5", title: "디자인 QA", status: "not-start", date: "2026-11-11", start: "11:00", end: "12:00", tags: ["업무"] },
  { id: "m6", title: "블로그 초안", status: "not-start", date: "2026-11-12", tags: ["사이드"] },
  { id: "m7", title: "1:1 미팅", status: "not-start", date: "2026-11-12", start: "16:00", end: "16:30", tags: ["업무"] },
  { id: "m8", title: "릴리스 노트 작성", status: "not-start", date: "2026-11-13", start: "15:00", end: "16:00", tags: ["업무"] },
  { id: "m9", title: "모의 면접", status: "not-start", date: "2026-11-16", start: "19:00", end: "20:00", tags: ["학습"] },
  { id: "m10", title: "사이드 프로젝트 배포", status: "not-start", date: "2026-11-17", due: "2026-11-19", tags: ["사이드"] },
  { id: "m11", title: "보안 점검", status: "not-start", date: "2026-11-18", start: "10:00", end: "12:00", tags: ["업무", "버그"] },
  { id: "m12", title: "월간 회고", status: "not-start", date: "2026-11-20", start: "17:00", end: "18:00", tags: ["학습"] },
];

/** 할 일을 만든 시각: 시작일 이틀 전 오전 9시(로컬). */
const createdAt = (dateKey: string): string => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d - 2, 9, 0).toISOString();
};

export const todoSeed: Todo[] = SEEDS.map((s) => ({
  id: `demo-${s.id}`,
  title: s.title,
  completed: s.status === "done",
  dateKey: s.date,
  createdAt: createdAt(s.date),
  completedAt: s.status === "done" ? createdAt(s.date) : null,
  status: s.status,
  description: s.note ?? "",
  startTime: s.start ?? null,
  endTime: s.end ?? null,
  calendarLinked: s.gcal === "synced",
  calendarPushStatus: s.gcal ?? null,
  isVirtual: false,
  seriesId: null,
  originalDateKey: null,
  recurrenceRule: s.rule ?? null,
  tags: s.tags,
  dueDate: s.due ?? null,
}));
