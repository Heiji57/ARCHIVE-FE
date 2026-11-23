/**
 * 데모 대본. 실제 입력 텍스트와 무관하게 항상 같은 흐름을 반환한다(명세 3장).
 * 규칙 기반 AI 흉내(prototype의 parseTodos 등)는 옮기지 않는다.
 */

import type { Proposal } from "./proposal";

/** 진행 단계 하나. */
export interface DemoStep {
  /** 진행 중 보여 줄 문장. */
  label: string;
  /** 완료 후 보여 줄 자료 이름. */
  resultLabel: string;
}

/** 데모 AI 응답 전체. */
export interface DemoResponse {
  /** 완료 후 보여 줄 요약 문장 (HTML 허용). */
  say: string;
  /** 진행 단계 목록. */
  steps: DemoStep[];
  /** 최종 제안. */
  proposal: Proposal;
}

/** 데모 고정 대본. 항상 이 값을 반환한다. */
export function getDemoResponse(): DemoResponse {
  const tomorrow = getTomorrow();

  return {
    say: `할 일 <b>3개</b>로 정리했어요. 1개는 이미 있는 일정과 시간이 겹쳐요. 이대로 추가할까요?`,
    steps: [
      {
        label: "부탁 읽는 중",
        resultLabel: "부탁 내용 확인",
      },
      {
        label: "날짜와 시간 맞추는 중",
        resultLabel: "날짜·시간 붙임",
      },
      {
        label: "겹치는 일정 찾는 중",
        resultLabel: "겹치는 일정 1개",
      },
    ],
    proposal: {
      kind: "todos",
      items: [
        {
          key: "demo-1",
          title: "스프린트 회의",
          dateKey: tomorrow,
          startTime: "10:00",
          endTime: "11:00",
          clash: "디자인 미팅",
          selected: true,
        },
        {
          key: "demo-2",
          title: "디자인 리뷰",
          dateKey: tomorrow,
          startTime: "14:00",
          endTime: "15:00",
          clash: null,
          selected: true,
        },
        {
          key: "demo-3",
          title: "릴리스 노트 정리",
          dateKey: getFriday(),
          startTime: null,
          endTime: null,
          clash: null,
          selected: true,
        },
      ],
    },
  };
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateKey(d);
}

function getFriday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=일, 5=금
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return toDateKey(d);
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
