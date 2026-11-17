/**
 * 회고 주제 데모 데이터 (`?demo=true` 전용). 시안 `prototypes/linear-shell/d-retro2.html` 의
 * TOPICS(주제 4개), TV(주제별 큰 주제와 날짜별 한 일, 근거), 근거 회고와 그날 커밋을 옮겼다.
 *
 * 시안 기준일은 2026-11-03 이다. `buildDemoTopics(today)` 는 모든 날짜를 `today - 2026-11-03` 만큼
 * 옮겨서 앱 데모 기준일(DEMO_ANCHOR_DATE_KEY)에서도 "이번 주, 지난주, 앞으로 할 일" 이 시안과 같은 모양이 되게 한다.
 * 주제 정리 결과는 여러 위젯(주제 화면, 검색, AI 등)이 쓸 수 있어 entities 에 둔다.
 * 문구는 사용자가 쓴 데이터만 넣는다. 제목 없는 회고의 기본 제목 같은 UI 문구는 화면이 i18n 으로 만든다.
 */
import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { GitHubCommit } from "@/entities/github/model/types";
import type { TaskStatus } from "@/entities/todo/model/types";
import type {
  DigestStatus,
  Topic,
  TopicSourceMap,
  TopicStructured,
  TopicTheme,
} from "./types";

/** 시안 데이터의 "오늘". */
export const DEMO_TOPIC_SOURCE_TODAY = "2026-11-03";

export interface DemoTopicEntry {
  id: string;
  retroType: RetrospectiveType;
  dateKey: string;
  /** 주간, 월간, 연간 회고의 끝 날짜 */
  untilDateKey: string | null;
  /** 비어 있으면 화면이 기본 제목을 만든다 */
  title: string;
  /** markdown (## 제목, - 목록, `코드`) */
  body: string;
  commitShas: string[];
}

export interface DemoTopicDigest {
  /** "none": 한 번도 정리하지 않음 */
  status: DigestStatus | "none";
  watermarkDateKey: string | null;
  /** status 가 "none" 이면 정리하기를 누른 뒤 보여 줄 결과 */
  structured: TopicStructured;
  sources: TopicSourceMap;
  /** 정리 뒤에 쓴 회고 수 (06-topic §3 unreflected_entry_count) */
  unreflectedEntryCount: number;
  /** 정리 뒤에 쓴 회고 id (그래프와 개수용) */
  extraEntryIds: string[];
  /** 근거 회고의 처음과 마지막 날짜 (§3 period_*) */
  periodStartDateKey: string | null;
  periodEndDateKey: string | null;
}

export interface DemoTopicBundle {
  topics: Topic[];
  digests: Record<string, DemoTopicDigest>;
  entries: Record<string, DemoTopicEntry>;
  commits: GitHubCommit[];
}

// ─── 날짜 옮기기 ───────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const toUtc = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const shifter = (today: string) => {
  const off = Math.round((toUtc(today) - toUtc(DEMO_TOPIC_SOURCE_TODAY)) / DAY_MS);
  return (k: string) => fromUtc(toUtc(k) + off * DAY_MS);
};

// ─── 시안 원본 (날짜는 2026-11-03 기준) ───────────────────────────────────────

type RawEntry = Omit<DemoTopicEntry, "commitShas"> & { commits: string[] };

const RAW_ENTRIES: RawEntry[] = [
  {
    id: "d1102", retroType: "daily", dateKey: "2026-11-02", untilDateKey: null, title: "토큰 재발급 루프 잡은 날", commits: [],
    body: `## 오늘 한 일
- 토큰 재발급 루프 버그 수정. 만료 직전 요청 두 개가 겹치면 refresh 가 두 번 돌았다.
- 설정 가이드 문서 정리
## 배운 점
- 동시에 401 이 오면 refresh 를 하나로 모으는 큐가 필요하다. \`pendingRefresh\` 프라미스를 공유해서 해결.
- 지난주에 본 401 도 같은 원인이었다.
## 내일
- 드래그로 마감일 옮길 때 dueDate 가 하루 밀리는 문제 보기
- 스프린트 회의 안건 정리`,
  },
  {
    id: "d1101", retroType: "daily", dateKey: "2026-11-01", untilDateKey: null, title: "", commits: [],
    body: `## 오늘 한 일
- 그래프 문제 두 개. 다익스트라는 아직 손에 익지 않음.
- 다음 주 계획: 캘린더 DnD 마무리, 회고 페이지 시안
## 느낀 점
일요일에 계획을 세워 두니 월요일 아침이 편하다. 매주 하기.`,
  },
  {
    id: "d1030", retroType: "daily", dateKey: "2026-10-30", untilDateKey: null, title: "월간 뷰 무한 스크롤",
    commits: ["feat(calendar): month infinite scroll", "fix: 경계 주 깜빡임"],
    body: `## 오늘 한 일
- 월간 뷰를 세로 무한 스크롤로 바꿈. 위로 붙일 때 스크롤 위치를 보정해야 화면이 안 튐.
- 눈금자 손잡이 때 쓴 보정 방식을 그대로 가져옴.
- 디자인 리뷰: 경계선 색이 너무 강하다는 의견
## 아쉬운 점
- 테스트 없이 머지했다. 내일 경계 케이스 테스트 추가.`,
  },
  {
    id: "d1028", retroType: "daily", dateKey: "2026-10-28", untilDateKey: null, title: "",
    commits: ["feat(settings): notification api"],
    body: `## 오늘 한 일
- 알림 설정 API 연결. 백엔드 응답 필드 이름이 문서와 달라서 요청 문서 작성.
## 내일
- be-request 문서 공유`,
  },
  {
    id: "d1027", retroType: "daily", dateKey: "2026-10-27", untilDateKey: null, title: "",
    commits: ["feat(i18n): region locales", "chore: 키 정렬"],
    body: `## 오늘 한 일
- i18n 지역별 로케일 16개 추가
- 스프린트 회고: 리뷰가 몰리는 금요일을 피하자는 이야기
## 배운 점
- 하드코딩 문자열은 lint 규칙으로 막는 게 제일 싸다.`,
  },
  {
    id: "d1021", retroType: "daily", dateKey: "2026-10-21", untilDateKey: null, title: "",
    commits: ["feat(settings): integrations redesign", "fix(settings): range handle"],
    body: `## 오늘 한 일
- 설정의 GitHub · Calendar 연동 카드 재디자인
- 기간 눈금자 손잡이가 겹칠 때 잡히지 않던 버그
## 내일
- mock 모드 기간 값 이관`,
  },
  {
    id: "d1020", retroType: "daily", dateKey: "2026-10-20", untilDateKey: null, title: "",
    commits: ["docs: sprint plan"],
    body: `## 오늘 한 일
- 스프린트 계획. 이번 스프린트 목표는 캘린더 다듬기.`,
  },
  {
    id: "w1025", retroType: "weekly", dateKey: "2026-10-25", untilDateKey: "2026-10-31", title: "", commits: [],
    body: `## 한 주 요약
월간 뷰 무한 스크롤과 알림 설정 API 연결이 중심이었던 한 주. 회고 4편, 끝낸 일 11개, 커밋 14개.
## 잘된 점
- 스크롤 보정 로직을 공용으로 뽑아 주간 · 월간이 같이 씀
- 백엔드 요청 문서를 바로 써서 막힌 시간이 짧았음
## 다음 주에
- 머지 전에 경계 케이스 테스트 쓰기
- 금요일 리뷰 몰림 줄이기`,
  },
  {
    id: "m10", retroType: "monthly", dateKey: "2026-10-01", untilDateKey: "2026-10-31", title: "", commits: [],
    body: `## 한 달 요약
설정 재디자인 → i18n → 캘린더 무한 스크롤 순서로 진행. 회고 14편, 커밋 61개.
## 가장 많이 나온 말
- "경계 케이스", "스크롤 보정", "문서 먼저"`,
  },
];

type RawItem = [dateKey: string, text: string, source: string | number];
interface RawTopic {
  id: string;
  name: string;
  description: string;
  status: "completed" | "none";
  watermark: string | null;
  summary: string;
  todos: Array<[title: string, dateKey: string, status: "done" | "doing" | "open"]>;
  themes: Array<{ name: string; summary: string; items: RawItem[] }>;
  extra?: string[];
}

const RAW_TOPICS: RawTopic[] = [
  {
    id: "tp1", name: "캘린더 다듬기", description: "캘린더 끌어 놓기, 무한 스크롤, 월간 뷰처럼 캘린더 화면을 다듬은 기록",
    status: "completed", watermark: "2026-11-02",
    summary: "월간 무한 스크롤을 끝냈고, 지금은 끌어 놓을 때 마감일이 밀리는 문제를 보고 있어요.",
    todos: [["스프린트 계획", "2026-10-20", "done"], ["주간 뷰 스크롤 보정 공용화", "2026-10-29", "done"], ["월간 뷰 세로 무한 스크롤", "2026-10-30", "done"], ["경계 주 깜빡임 고치기", "2026-10-30", "done"], ["디자인 리뷰", "2026-10-30", "done"], ["경계 케이스 테스트 추가", "2026-10-31", "open"], ["끌어 놓을 때 마감일이 하루 밀림", "2026-11-03", "doing"], ["경계선 색 낮추기", "2026-11-04", "open"], ["캘린더 끌어 놓기 마무리", "2026-11-05", "open"]],
    themes: [
      { name: "무한 스크롤", summary: "월간 뷰를 세로 무한 스크롤로 바꾸고, 위로 붙일 때 위치를 보정했어요.", items: [["2026-10-21", "설정 눈금자 손잡이를 고치며 위치 보정 방식을 처음 씀", "d1021"], ["2026-10-29", "주간 뷰 스크롤 보정을 공용 로직으로 뽑음", 1], ["2026-10-30", "월간 뷰를 세로 무한 스크롤로 바꾸고, 눈금자 때의 보정 방식을 그대로 가져옴", "d1030"], ["2026-10-30", "월간 뷰 무한 스크롤을 끝냄", 2], ["2026-10-31", "주간 회고에서 주간과 월간이 같은 로직을 쓰는 걸 잘된 점으로 꼽음", "w1025"]] },
      { name: "경계 케이스", summary: "경계 주에서 화면이 깜빡였고, 테스트 없이 머지한 날이 있었어요.", items: [["2026-10-30", "경계 주 깜빡임을 고침", 3], ["2026-10-30", "테스트 없이 머지해서 경계 케이스 테스트를 다음 날로 미룸", "d1030"], ["2026-10-31", "다음 주에는 머지 전에 경계 케이스 테스트를 쓰기로 함", "w1025"], ["2026-10-31", "경계 케이스 테스트 추가는 아직", 5]] },
      { name: "끌어 놓기", summary: "드래그로 마감일을 옮기면 하루 밀리는 문제를 보는 중이에요.", items: [["2026-11-01", "다음 주 계획에 캘린더 끌어 놓기 마무리를 넣음", "d1101"], ["2026-11-02", "마감일이 하루 밀리는 문제를 다음 날 보기로 함", "d1102"], ["2026-11-03", "마감일 하루 밀림을 고치는 중", 6], ["2026-11-05", "끌어 놓기 마무리 예정", 8]] },
      { name: "계획과 리뷰", summary: "스프린트 목표를 캘린더로 잡았고, 리뷰에서 경계선 색 이야기가 나왔어요.", items: [["2026-10-20", "이번 스프린트 목표를 캘린더 다듬기로 정함", "d1020"], ["2026-10-20", "스프린트 계획", 0], ["2026-10-30", "디자인 리뷰에서 경계선 색이 너무 강하다는 의견", "d1030"], ["2026-10-30", "디자인 리뷰", 4], ["2026-11-04", "경계선 색 낮추기 예정", 7]] },
    ],
  },
  {
    id: "tp2", name: "인증 · 토큰", description: "로그인, 토큰 재발급, 401 처리와 관련된 회고와 할 일",
    status: "completed", watermark: "2026-10-31", extra: ["d1102"],
    summary: "동시에 오는 401 이 refresh 를 두 번 부르는 게 원인이었어요.",
    todos: [["알림 설정 API 연결", "2026-10-28", "done"], ["be-request 문서 공유", "2026-10-29", "done"], ["토큰 재발급 루프 수정", "2026-11-02", "done"], ["401 동시 요청 테스트", "2026-11-04", "open"]],
    themes: [
      { name: "401 원인", summary: "동시에 오는 요청이 refresh 를 두 번 불러서 401 이 났어요.", items: [["2026-10-28", "알림 설정 API 를 붙이다 처음 401 을 봄", 0], ["2026-10-28", "동시에 오는 요청이 refresh 를 두 번 부르는 게 원인", "d1028"], ["2026-11-04", "401 이 동시에 오는 경우 테스트 예정", 3]] },
      { name: "백엔드 요청 문서", summary: "응답 필드 이름이 문서와 달라 요청 문서를 바로 썼어요.", items: [["2026-10-28", "응답 필드 이름이 문서와 달라 요청 문서를 씀", "d1028"], ["2026-10-29", "be-request 문서 공유", 1], ["2026-10-31", "주간 회고에서 문서를 바로 써서 막힌 시간이 짧았다고 정리", "w1025"]] },
    ],
  },
  {
    id: "tp3", name: "i18n", description: "로케일, 번역 키, 하드코딩 문구 정리",
    status: "completed", watermark: "2026-10-31",
    summary: "지역별 로케일 16개를 넣었고, 하드코딩 문구는 lint 로 막기로 했어요.",
    todos: [["i18n 키 정리", "2026-10-27", "done"], ["지역별 로케일 16개", "2026-10-27", "done"], ["하드코딩 문구 lint 규칙", "2026-11-06", "open"]],
    themes: [
      { name: "로케일", summary: "지역별 로케일 16개를 넣고 번역 키를 정리했어요.", items: [["2026-10-27", "지역별 로케일 16개 추가", 1], ["2026-10-27", "번역 키 정리", 0], ["2026-10-27", "i18n 작업과 스프린트 회고를 함께 남김", "d1027"], ["2026-10-31", "10월 흐름에서는 설정 재디자인 다음 순서였음", "m10"]] },
      { name: "하드코딩 문구", summary: "하드코딩 문자열은 lint 규칙으로 막기로 했어요.", items: [["2026-10-27", "하드코딩 문자열은 lint 규칙으로 막는 게 가장 싸다고 정리", "d1027"], ["2026-11-06", "lint 규칙 추가 예정", 2]] },
    ],
  },
  {
    id: "tp4", name: "알고리즘 스터디", description: "주말 스터디에서 푼 문제와 막힌 지점",
    status: "none", watermark: null,
    summary: "주말마다 두 문제씩 풀고 있고, 다익스트라가 아직 손에 익지 않았어요.",
    todos: [["알고리즘 스터디 2문제", "2026-11-01", "done"], ["그래프 문제 하나 더", "2026-11-08", "open"]],
    themes: [
      { name: "그래프 문제", summary: "주말마다 그래프 문제를 풀고, 다익스트라가 아직 손에 익지 않았어요.", items: [["2026-11-01", "그래프 문제 두 개를 풂", 0], ["2026-11-01", "다익스트라는 아직 손에 익지 않음", "d1101"], ["2026-11-08", "그래프 문제 하나 더 풀기 예정", 1]] },
      { name: "주간 계획", summary: "일요일에 다음 주 계획을 세우니 월요일이 편했어요.", items: [["2026-11-01", "일요일에 계획을 세우니 월요일 아침이 편함", "d1101"]] },
    ],
  },
];

const TODO_STATUS: Record<"done" | "doing" | "open", TaskStatus> = {
  done: "done",
  doing: "in-progress",
  open: "not-start",
};

/** 커밋 sha 대신 쓰는 데모 값(40자). */
const fakeSha = (seed: string) => {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return (h.toString(16).padStart(8, "0").repeat(5)).slice(0, 40);
};

/**
 * 데모 주제 묶음. `today` 는 데모의 "오늘"(DEMO_ANCHOR_DATE_KEY). 시안 날짜를 그만큼 옮긴다.
 */
export function buildDemoTopics(today: string): DemoTopicBundle {
  const sh = shifter(today);

  const commits: GitHubCommit[] = [];
  const entries: Record<string, DemoTopicEntry> = {};
  for (const e of RAW_ENTRIES) {
    const dateKey = e.retroType === "monthly" ? `${sh(e.untilDateKey ?? e.dateKey).slice(0, 7)}-01` : sh(e.dateKey);
    const shas = e.commits.map((message, j) => {
      const sha = fakeSha(`${e.id}:${j}`);
      commits.push({
        repositoryId: "demo-repo",
        fullName: "archive/my-app",
        sha,
        message,
        htmlUrl: "",
        author: "demo",
        committedAt: `${dateKey}T${String(10 + j * 3).padStart(2, "0")}:20:00+09:00`,
      });
      return sha;
    });
    entries[e.id] = {
      id: e.id,
      retroType: e.retroType,
      dateKey,
      untilDateKey: e.untilDateKey ? sh(e.untilDateKey) : null,
      title: e.title,
      body: e.body,
      commitShas: shas,
    };
  }

  const topics: Topic[] = [];
  const digests: Record<string, DemoTopicDigest> = {};
  RAW_TOPICS.forEach((raw, i) => {
    const todoId = (n: number) => `${raw.id}-td${n}`;
    const sources: TopicSourceMap = {};
    raw.todos.forEach(([title, d, st], n) => {
      sources[todoId(n)] = { kind: "todo", title, dateKey: sh(d), status: TODO_STATUS[st] };
    });
    const entryIds = new Set<string>();
    const themes: TopicTheme[] = raw.themes.map((th, k) => ({
      key: `t${k + 1}`,
      name: th.name,
      summary: th.summary,
      items: th.items.map(([d, text, src]) => {
        if (typeof src === "number") return { dateKey: sh(d), text, source: { kind: "todo" as const, id: todoId(src) } };
        entryIds.add(src);
        return { dateKey: sh(d), text, source: { kind: "entry" as const, id: src } };
      }),
    }));
    for (const id of entryIds) {
      const e = entries[id];
      sources[id] = { kind: "entry", title: e.title, dateKey: e.dateKey, retroType: e.retroType };
    }
    const extra = raw.extra ?? [];
    // 기간: 근거 회고 날짜(주간, 월간은 끝 날짜). 시안 tvSpan 과 같다.
    const spanDates = [...entryIds, ...extra]
      .map((id) => entries[id].untilDateKey ?? entries[id].dateKey)
      .sort();
    const watermark = raw.watermark ? sh(raw.watermark) : null;
    topics.push({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      createdAt: `${sh("2026-10-01")}T0${i}:00:00+09:00`,
      updatedAt: null,
      entryCount: entryIds.size + extra.length,
      todoCount: raw.todos.length,
      digestWatermarkDateKey: raw.status === "completed" ? watermark : null,
    });
    digests[raw.id] = {
      status: raw.status,
      watermarkDateKey: raw.status === "completed" ? watermark : null,
      structured: { version: 1, summary: raw.summary, themes },
      sources,
      unreflectedEntryCount: watermark
        ? [...entryIds, ...extra].filter((id) => entries[id].dateKey > watermark).length
        : 0,
      extraEntryIds: extra,
      periodStartDateKey: spanDates[0] ?? null,
      periodEndDateKey: spanDates[spanDates.length - 1] ?? null,
    };
  });

  return { topics, digests, entries, commits };
}
