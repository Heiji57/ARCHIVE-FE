import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { RetroTemplate } from "./types";

/** 기본값으로 초기화할 때 사용하는 원본 마크다운 */
export const DEFAULT_TEMPLATE_CONTENT: Record<RetrospectiveType, string> = {
  daily: [
    "## 오늘 한 일",
    "",
    "",
    "## 배운 것",
    "",
    "",
    "## 내일 할 일",
    "",
    "",
    "## 느낀 점",
  ].join("\n"),
  weekly: [
    "## 이번 주 성과",
    "",
    "",
    "## 잘한 점",
    "",
    "",
    "## 개선할 점",
    "",
    "",
    "## 다음 주 목표",
  ].join("\n"),
  monthly: [
    "## 이달의 성과",
    "",
    "",
    "## 목표 달성 현황",
    "",
    "",
    "## 배운 것",
    "",
    "",
    "## 다음 달 계획",
  ].join("\n"),
  yearly: [
    "## 올해의 성과",
    "",
    "",
    "## 주요 마일스톤",
    "",
    "",
    "## 성장한 부분",
    "",
    "",
    "## 내년 목표",
  ].join("\n"),
};

const DEFAULT_TEMPLATE_NAME: Record<RetrospectiveType, string> = {
  daily: "기본 일간 템플릿",
  weekly: "기본 주간 템플릿",
  monthly: "기본 월간 템플릿",
  yearly: "기본 연간 템플릿",
};

const EPOCH = "2024-01-01T00:00:00.000Z";

export const DEFAULT_TEMPLATES: RetroTemplate[] = (
  ["daily", "weekly", "monthly", "yearly"] as RetrospectiveType[]
).map((type) => ({
  id: `default-template-${type}`,
  name: DEFAULT_TEMPLATE_NAME[type],
  retroType: type,
  content: DEFAULT_TEMPLATE_CONTENT[type],
  isDefault: true,
  createdAt: EPOCH,
  updatedAt: EPOCH,
}));

/** retroType → 기본 활성 템플릿 id (각 타입의 기본 템플릿) */
export const DEFAULT_ACTIVE_TEMPLATE_IDS: Record<RetrospectiveType, string> = {
  daily: "default-template-daily",
  weekly: "default-template-weekly",
  monthly: "default-template-monthly",
  yearly: "default-template-yearly",
};

/** 기본 템플릿 id (해당 타입의 fallback). */
export function defaultTemplateId(type: RetrospectiveType): string {
  return `default-template-${type}`;
}
