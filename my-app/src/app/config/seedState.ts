import { DEFAULT_SETTINGS } from "@/app/model/settings";
import type { PersistedAppState } from "@/app/model/types";
import { DEFAULT_ACTIVE_TEMPLATE_IDS, DEFAULT_TEMPLATES } from "@/entities/template";
import { addDays, toDateKey } from "@/shared/lib/date";

const baseDate = new Date(2023, 9, 25, 12);
const previousDay = addDays(baseDate, -1);
const weeklyDate = new Date(2023, 9, 20, 12);
const monthlyDate = new Date(2023, 8, 30, 12);
const yearlyDate = new Date(2022, 11, 31, 12);

export const seedState: PersistedAppState = {
  todos: [
    {
      id: "todo-1",
      title: "API 명세서 작성",
      completed: true,
      dateKey: "2023-10-25",
      createdAt: baseDate.toISOString(),
      completedAt: baseDate.toISOString(),
      status: "done",
      description: "백엔드 API 명세를 문서화하고 팀 공유용 요약까지 정리합니다.",
    },
    {
      id: "todo-2",
      title: "Redis 캐싱 적용",
      completed: false,
      dateKey: "2023-10-26",
      createdAt: addDays(baseDate, 1).toISOString(),
      completedAt: null,
      status: "in-progress",
      description: "주요 조회 API에 Redis 캐시 레이어를 붙이고 만료 정책을 검토합니다.",
    },
    {
      id: "todo-3",
      title: "팀 주간 회의",
      completed: true,
      dateKey: "2023-10-26",
      createdAt: addDays(baseDate, 1).toISOString(),
      completedAt: addDays(baseDate, 1).toISOString(),
      status: "done",
      description: "주간 회고와 다음 스프린트 우선순위를 논의하는 회의입니다.",
    },
    {
      id: "todo-4",
      title: "Next.js 라우팅 설정",
      completed: false,
      dateKey: "2023-10-27",
      createdAt: addDays(baseDate, 2).toISOString(),
      completedAt: null,
      status: "not-start",
      description: "페이지별 라우팅을 정리하고 공통 레이아웃과 연결합니다.",
    },
    {
      id: "todo-5",
      title: "GitHub OAuth 연동",
      completed: false,
      dateKey: "2023-10-27",
      createdAt: addDays(baseDate, 2).toISOString(),
      completedAt: null,
      status: "not-start",
      description: "GitHub 계정 연결과 토큰 저장 흐름을 설계합니다.",
    },
  ],
  entries: [
    {
      id: "entry-1",
      dateKey: toDateKey(baseDate),
      updatedAt: baseDate.toISOString(),
      title: "백엔드 초기 세팅 완료",
      synced: true,
      retroType: "daily",
      content:
        "Redis를 로컬에 세팅하면서 Docker 환경과 호스트 간 포트 매핑 문제로 시간을 많이 썼다. 다음부터는 docker-compose 설정부터 먼저 점검해야겠다.",
    },
    {
      id: "entry-2",
      dateKey: toDateKey(previousDay),
      updatedAt: previousDay.toISOString(),
      title: "DB 스키마 설계",
      synced: true,
      retroType: "daily",
      content:
        "ERD를 구체화하면서 사용자와 회고 작업 간 관계를 다시 확인했다. 관계형 설계 초반에는 naming rule을 먼저 정하는 것이 중요하다.",
    },
    {
      id: "entry-3",
      dateKey: toDateKey(weeklyDate),
      updatedAt: weeklyDate.toISOString(),
      title: "10월 3주차 주간 회고",
      synced: true,
      retroType: "weekly",
      content:
        "주간 단위로 보면 일정 관리보다 회고 템플릿 정리가 더 큰 병목이었다. UI 초안을 빠르게 만들고 구조를 나중에 맞추는 방식이 효과적이었다.",
    },
    {
      id: "entry-4",
      dateKey: toDateKey(monthlyDate),
      updatedAt: monthlyDate.toISOString(),
      title: "9월 월간 회고",
      synced: true,
      retroType: "monthly",
      content:
        "한 달 동안 쌓인 작업 로그를 다시 보고 반복되는 작업 패턴을 정리했다. 월간 회고는 다음 달 계획과 바로 이어지도록 쓰는 것이 중요하다.",
    },
    {
      id: "entry-5",
      dateKey: toDateKey(yearlyDate),
      updatedAt: yearlyDate.toISOString(),
      title: "2022년 연간 회고",
      synced: true,
      retroType: "yearly",
      content:
        "초기 프로젝트에서 가장 크게 배운 점은 기록을 열심히 남기는 것보다 회고의 주기를 유지하는 것이 더 중요하다는 사실이었다.",
    },
    {
      id: "entry-draft",
      dateKey: "2023-10-26",
      updatedAt: addDays(baseDate, 1).toISOString(),
      title: "작성 중인 회고록",
      synced: false,
      retroType: "daily",
      content:
        "오늘은 Redis 적용 과정에서 Docker 포트 이슈를 해결했고, API 문서 초안을 빠르게 정리했다.",
    },
  ],
  githubConfig: {
    token: "",
    owner: "developer",
    repo: "my-daily-retrospectives",
    enabled: true,
    lastSyncedAt: addDays(baseDate, 1).toISOString(),
    connectedAs: "developer",
    targetRepository: "developer/my-daily-retrospectives",
    permissions: ["Read Commits", "Write to Repositories"],
    trackedRepositories: [
      { id: "repo-1", name: "archive-backend", enabled: true },
      { id: "repo-2", name: "archive-frontend", enabled: true },
      { id: "repo-3", name: "my-personal-website", enabled: false },
    ],
    autoRetrospectiveEnabled: true,
  },
  notifications: [],
  settings: { ...DEFAULT_SETTINGS },
  pendingSummary: null,
  currentUser: null,
  rememberMe: false,
  templates: DEFAULT_TEMPLATES,
  activeTemplateIds: DEFAULT_ACTIVE_TEMPLATE_IDS,
};
