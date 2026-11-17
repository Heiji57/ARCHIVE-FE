import type { JournalEntry } from "@/entities/entry/model/types";
import type { Folder } from "@/entities/folder/model/types";

/**
 * 회고 데모 데이터(시안 d-retro2.html 의 회고 목록 그대로, 2026년 10~11월).
 * seedState(mock 모드)와 데모 모드 시작 상태가 같이 쓴다.
 *
 * 시안과 다른 점: 요약의 dateKey 는 서버 계약대로 기간의 마지막 날이고 주는 ISO(월~일)다.
 * 그래서 시안의 "10/25 ~ 10/31" 주간은 10/26 ~ 11/1(dateKey 11/1), "10/18 ~ 10/24" 는 10/19 ~ 10/25 로 옮겼다.
 * 시안 본문의 [[회고 링크]]와 #태그는 앱에 없는 기능이라 평문으로 바꿨다.
 */

const T = "2026-11-03T09:00:00.000Z";

export const RETRO_SEED_FOLDERS: Folder[] = [
  { id: "folder-dev", name: "ARCHIVE 개발", parentFolderId: null, folderCount: 0, entryCount: 8, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: null },
  { id: "folder-study", name: "스터디", parentFolderId: null, folderCount: 0, entryCount: 2, createdAt: "2026-09-02T00:00:00.000Z", updatedAt: null },
];

type Seed = Pick<JournalEntry, "id" | "dateKey" | "title" | "retroType" | "content"> & {
  folderId?: string | null;
  synced?: boolean;
};

const seed = (x: Seed): JournalEntry => ({
  updatedAt: `${x.dateKey}T21:00:00.000Z`,
  githubPush: null,
  synced: x.synced ?? true,
  isSummary: x.retroType !== "daily",
  status: x.retroType === "daily" ? null : "completed",
  folderId: x.folderId === undefined ? "folder-dev" : x.folderId,
  ...x,
});

export const RETRO_SEED_ENTRIES: JournalEntry[] = [
  seed({
    id: "d1102",
    dateKey: "2026-11-02",
    retroType: "daily",
    title: "토큰 재발급 루프 잡은 날",
    content: `## 오늘 한 일
- 토큰 재발급 루프 버그 수정. 만료 직전 요청 두 개가 겹치면 refresh 가 두 번 돌았다.
- 설정 가이드 문서 정리

## 배운 점
- 동시에 401 이 오면 refresh 를 하나로 모으는 큐가 필요하다. \`pendingRefresh\` 프라미스를 공유해서 해결.
- 10월 28일 에 본 401 도 같은 원인이었다.

## 내일
- 드래그로 마감일 옮길 때 dueDate 가 하루 밀리는 문제 보기
- 스프린트 회의 안건 정리`,
  }),
  seed({
    id: "d1101",
    dateKey: "2026-11-01",
    retroType: "daily",
    title: "",
    folderId: "folder-study",
    content: `## 오늘 한 일
- 그래프 문제 두 개. 다익스트라는 아직 손에 익지 않음.
- 다음 주 계획: 캘린더 DnD 마무리, 회고 페이지 시안

## 느낀 점
일요일에 계획을 세워 두니 월요일 아침이 편하다. 매주 하기.`,
  }),
  seed({
    id: "d1030",
    dateKey: "2026-10-30",
    retroType: "daily",
    title: "월간 뷰 무한 스크롤",
    content: `## 오늘 한 일
- 월간 뷰를 세로 무한 스크롤로 바꿈. 위로 붙일 때 스크롤 위치를 보정해야 화면이 안 튐.
- 10월 21일 눈금자 손잡이 때 쓴 보정 방식을 그대로 가져옴.
- 디자인 리뷰: 경계선 색이 너무 강하다는 의견

## 아쉬운 점
- 테스트 없이 머지했다. 내일 경계 케이스 테스트 추가.`,
  }),
  seed({
    id: "d1028",
    dateKey: "2026-10-28",
    retroType: "daily",
    title: "",
    synced: false,
    content: `## 오늘 한 일
- 알림 설정 API 연결. 백엔드 응답 필드 이름이 문서와 달라서 요청 문서 작성.

## 내일
- be-request 문서 공유`,
  }),
  seed({
    id: "d1027",
    dateKey: "2026-10-27",
    retroType: "daily",
    title: "",
    content: `## 오늘 한 일
- i18n 지역별 로케일 16개 추가
- 스프린트 회고: 리뷰가 몰리는 금요일을 피하자는 이야기. 3주차 회고 에서 처음 나옴

## 배운 점
- 하드코딩 문자열은 lint 규칙으로 막는 게 제일 싸다.`,
  }),
  seed({
    id: "d1023",
    dateKey: "2026-10-23",
    retroType: "daily",
    title: "",
    folderId: "folder-study",
    content: `## 오늘 한 일
- React 19 \`use\` 훅 문서. 서버 컴포넌트 없이도 쓸 데가 있을지 보기.`,
  }),
  seed({
    id: "d1021",
    dateKey: "2026-10-21",
    retroType: "daily",
    title: "",
    content: `## 오늘 한 일
- 설정의 GitHub · Calendar 연동 카드 재디자인
- 기간 눈금자 손잡이가 겹칠 때 잡히지 않던 버그

## 내일
- mock 모드 기간 값 이관`,
  }),
  seed({
    id: "d1020",
    dateKey: "2026-10-20",
    retroType: "daily",
    title: "",
    content: `## 오늘 한 일
- 스프린트 계획. 이번 스프린트 목표는 캘린더 다듬기.`,
  }),
  seed({
    id: "w1025",
    dateKey: "2026-11-01",
    retroType: "weekly",
    title: "",
    content: `## 한 주 요약
월간 뷰 무한 스크롤과 알림 설정 API 연결이 중심이었던 한 주. 회고 4편, 끝낸 일 11개, 커밋 14개.

## 잘된 점
- 스크롤 보정 로직을 공용으로 뽑아 주간 · 월간이 같이 씀 (10/30)
- 백엔드 요청 문서를 바로 써서 막힌 시간이 짧았음 (10/28)

## 다음 주에
- 머지 전에 경계 케이스 테스트 쓰기
- 금요일 리뷰 몰림 줄이기 (10/27)`,
  }),
  seed({
    id: "w1018",
    dateKey: "2026-10-25",
    retroType: "weekly",
    title: "",
    content: `## 한 주 요약
설정 화면 재디자인 주간. 연동 카드와 기간 눈금자를 끝냄 (10/21).

## 다음 주에
- mock 모드 정리`,
  }),
  seed({
    id: "m10",
    dateKey: "2026-10-31",
    retroType: "monthly",
    title: "",
    folderId: null,
    content: `## 한 달 요약
설정 재디자인 → i18n → 캘린더 무한 스크롤 순서로 진행. 회고 14편, 커밋 61개. 3주차 · 4주차 요약 참고

## 가장 많이 나온 말
- "경계 케이스", "스크롤 보정", "문서 먼저"

## 11월에
- 회고 페이지 개편, 캘린더 다중 관리`,
  }),
  seed({
    id: "y25",
    dateKey: "2025-12-31",
    retroType: "yearly",
    title: "",
    folderId: null,
    content: `## 한 해 요약
ARCHIVE 를 처음 만든 해. 회고 212편, 커밋 1,480개.`,
  }),
];

/** 시작 상태에 넣을 사본(상태가 바뀌어도 원본 배열은 그대로). */
export const retroSeedEntries = (): JournalEntry[] => RETRO_SEED_ENTRIES.map((x) => ({ ...x }));
export const retroSeedFolders = (): Folder[] => RETRO_SEED_FOLDERS.map((x) => ({ ...x }));

// updatedAt 기본값을 쓰지 않는 항목이 생기면 여기 기준 시각을 쓴다.
export const RETRO_SEED_UPDATED_AT = T;
