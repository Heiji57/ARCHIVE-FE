import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { PersistedAppState } from "@/app/model/types";
import { DEFAULT_ACTIVE_TEMPLATE_IDS, DEFAULT_TEMPLATES } from "@/entities/template";
import { addDays, toDateKey } from "@/shared/lib/date";
import { readSpellCheckPref } from "@/shared/lib/spellCheckPrefs";
import { readTodoBoardRange } from "@/shared/lib/todoRangePrefs";
import { todoSeed } from "./seed/todoSeed";

const baseDate = new Date(2023, 9, 25, 12);
const previousDay = addDays(baseDate, -1);
const weeklyDate = new Date(2023, 9, 20, 12);
const monthlyDate = new Date(2023, 8, 30, 12);
const yearlyDate = new Date(2022, 11, 31, 12);

export const seedState: PersistedAppState = {
  // 할 일 시작 데이터는 seed/todoSeed.ts(시안 데이터). 회고는 Task 4 가 같은 방식으로 뺀다.
  todos: todoSeed,
  entries: [
    {
      id: "entry-1",
      dateKey: toDateKey(baseDate),
      updatedAt: baseDate.toISOString(),
      title: "백엔드 초기 세팅 완료",
      githubPush: null,
      synced: true,
      retroType: "daily",
      folderId: null,
      content:
        "Redis를 로컬에 세팅하면서 Docker 환경과 호스트 간 포트 매핑 문제로 시간을 많이 썼다. 다음부터는 docker-compose 설정부터 먼저 점검해야겠다.",
    },
    {
      id: "entry-2",
      dateKey: toDateKey(previousDay),
      updatedAt: previousDay.toISOString(),
      title: "DB 스키마 설계",
      githubPush: null,
      synced: true,
      retroType: "daily",
      folderId: null,
      content:
        "ERD를 구체화하면서 사용자와 회고 작업 간 관계를 다시 확인했다. 관계형 설계 초반에는 naming rule을 먼저 정하는 것이 중요하다.",
    },
    {
      id: "entry-3",
      dateKey: toDateKey(weeklyDate),
      updatedAt: weeklyDate.toISOString(),
      title: "10월 3주차 주간 회고",
      githubPush: null,
      synced: true,
      retroType: "weekly",
      folderId: null,
      content:
        "주간 단위로 보면 일정 관리보다 회고 템플릿 정리가 더 큰 병목이었다. UI 초안을 빠르게 만들고 구조를 나중에 맞추는 방식이 효과적이었다.",
    },
    {
      id: "entry-4",
      dateKey: toDateKey(monthlyDate),
      updatedAt: monthlyDate.toISOString(),
      title: "9월 월간 회고",
      githubPush: null,
      synced: true,
      retroType: "monthly",
      folderId: null,
      content:
        "한 달 동안 쌓인 작업 로그를 다시 보고 반복되는 작업 패턴을 정리했다. 월간 회고는 다음 달 계획과 바로 이어지도록 쓰는 것이 중요하다.",
    },
    {
      id: "entry-5",
      dateKey: toDateKey(yearlyDate),
      updatedAt: yearlyDate.toISOString(),
      title: "2022년 연간 회고",
      githubPush: null,
      synced: true,
      retroType: "yearly",
      folderId: null,
      content:
        "초기 프로젝트에서 가장 크게 배운 점은 기록을 열심히 남기는 것보다 회고의 주기를 유지하는 것이 더 중요하다는 사실이었다.",
    },
    {
      id: "entry-draft",
      dateKey: "2023-10-26",
      updatedAt: addDays(baseDate, 1).toISOString(),
      title: "작성 중인 회고록",
      githubPush: null,
      synced: false,
      retroType: "daily",
      folderId: null,
      content:
        "오늘은 Redis 적용 과정에서 Docker 포트 이슈를 해결했고, API 문서 초안을 빠르게 정리했다.",
    },
  ],
  folders: [],
  notifications: [],
  settings: {
    ...DEFAULT_SETTINGS,
    todoBoardRange: readTodoBoardRange(DEFAULT_SETTINGS.todoBoardRange),
    spellCheck: readSpellCheckPref(DEFAULT_SETTINGS.spellCheck),
  },
  pendingSummary: null,
  currentUser: null,
  rememberMe: false,
  templates: DEFAULT_TEMPLATES,
  activeTemplateIds: DEFAULT_ACTIVE_TEMPLATE_IDS,
};
