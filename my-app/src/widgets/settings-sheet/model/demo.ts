import type { LinkedRepository } from "@/entities/github/model/types";
import type { TranslationKey } from "@/shared/lib/i18n";

/**
 * 설정 시트 데모 데이터(시안 d-settings.html V). 데모 모드(isDemoMode)에서만 읽는다.
 * 문구는 i18n 키로 두고 화면에서 번역한다.
 */

const repo = (id: string, name: string, isPrivate: boolean, commitReadEnabled: boolean): LinkedRepository => ({
  id,
  githubRepoId: id.length * 1000 + name.length,
  owner: "developer",
  name,
  fullName: `developer/${name}`,
  isPrivate,
  defaultBranch: "main",
  htmlUrl: `https://github.com/developer/${name}`,
  commitReadEnabled,
  createdAt: "2026-05-01T00:00:00Z",
  updatedAt: null,
});

/** 데모 연동: GitHub 은 연결됐지만 이메일 권한이 없고, Google Calendar 는 연결됨. */
export const DEMO_REPOS: LinkedRepository[] = [
  repo("ghrepo_fe", "archive-fe", true, true),
  repo("ghrepo_docs", "archive-docs", false, true),
  repo("ghrepo_be", "archive-be", true, false),
];

export const DEMO_PROFILE = { name: "developer", email: "developer@archive.dev" };

/** 사이드바 캘린더(시안 A.cals). 색은 토큰. */
export const DEMO_CALENDARS: Array<{ id: string; name: TranslationKey; color: string; def?: boolean; count: number }> = [
  { id: "me", name: "settingsSheet.work.cal.me", color: "var(--th1)", def: true, count: 4 },
  { id: "team", name: "settingsSheet.work.cal.team", color: "var(--th2)", count: 6 },
  { id: "study", name: "settingsSheet.work.cal.study", color: "var(--th3)", count: 2 },
];

/** 할 일에 태그가 없을 때 보여 줄 데모 태그(시안 A.TAG). */
export const DEMO_TAGS: Array<{ name: TranslationKey; count: number }> = [
  { name: "settingsSheet.work.tag.work", count: 6 },
  { name: "settingsSheet.work.tag.side", count: 3 },
  { name: "settingsSheet.work.tag.study", count: 2 },
];

export const DEMO_SCHED: Array<{ when: TranslationKey; what: TranslationKey }> = [
  { when: "settingsSheet.ai.sched1When", what: "settingsSheet.ai.sched1What" },
  { when: "settingsSheet.ai.sched2When", what: "settingsSheet.ai.sched2What" },
];

export interface DemoTrashItem {
  id: string;
  kind: "retro" | "todo";
  name: TranslationKey;
  agoDays: number;
  leftDays: number;
}

export const DEMO_TRASH: DemoTrashItem[] = [
  { id: "t1", kind: "retro", name: "settingsSheet.trash.item1", agoDays: 4, leftDays: 26 },
  { id: "t2", kind: "todo", name: "settingsSheet.trash.item2", agoDays: 6, leftDays: 24 },
];

/** 데모 AI 요약 템플릿(주간, 월간, 연간). 시안 V.tpls 의 일간 외 항목. */
export const DEMO_SUMMARY_TEMPLATES: Record<
  "weekly" | "monthly" | "annual",
  Array<{ id: string; ko: [string, string]; en: [string, string]; active: boolean }>
> = {
  weekly: [
    { id: "wk", ko: ["주간 돌아보기", "## 이번 주 한 일\n\n## 잘된 것\n\n## 막힌 것\n\n## 다음 주 목표\n"], en: ["Weekly review", "## This week\n\n## What went well\n\n## What got stuck\n\n## Next week's goals\n"], active: true },
    { id: "wkkpt", ko: ["주간 KPT", "## Keep\n\n## Problem\n\n## Try\n"], en: ["Weekly KPT", "## Keep\n\n## Problem\n\n## Try\n"], active: false },
  ],
  monthly: [
    { id: "mo", ko: ["월간 정리", "## 이번 달 큰 일\n\n## 배운 것\n\n## 다음 달에 할 것\n"], en: ["Monthly wrap-up", "## Big things this month\n\n## What I learned\n\n## Next month\n"], active: true },
  ],
  annual: [
    { id: "yr", ko: ["한 해 돌아보기", "## 올해 한 일\n\n## 가장 큰 변화\n\n## 내년 목표\n"], en: ["Year in review", "## What I did this year\n\n## Biggest change\n\n## Next year's goals\n"], active: true },
  ],
};
