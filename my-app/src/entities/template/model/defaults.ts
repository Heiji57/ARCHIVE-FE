import type { Locale } from "@/app/model/settings";
import type { RetrospectiveType } from "@/entities/entry/model/types";
import { DICTIONARIES, translate, type TranslationKey } from "@/shared/lib/i18n";
import type { RetroTemplate } from "./types";

const RETRO_TYPES: RetrospectiveType[] = ["daily", "weekly", "monthly", "yearly"];

const CONTENT_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "template.default.daily",
  weekly: "template.default.weekly",
  monthly: "template.default.monthly",
  yearly: "template.default.yearly",
};

const NAME_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "settings.templates.defaultName.daily",
  weekly: "settings.templates.defaultName.weekly",
  monthly: "settings.templates.defaultName.monthly",
  yearly: "settings.templates.defaultName.yearly",
};

/** 기본값으로 초기화할 때 사용하는 원본 마크다운 (locale 별). */
export function defaultTemplateContent(type: RetrospectiveType, locale: Locale): string {
  return translate(locale, CONTENT_KEY[type]);
}

const EPOCH = "2024-01-01T00:00:00.000Z";

/**
 * FE 내장 기본 템플릿 (mock/데모 모드용 — 로그인 시 서버 템플릿으로 교체된다).
 * 본문은 영어로 만들어 두고, 초기 상태에서 `localizeDefaultTemplates` 로
 * 현재 locale 에 맞춘다.
 */
export const DEFAULT_TEMPLATES: RetroTemplate[] = RETRO_TYPES.map((type) => ({
  id: `default-template-${type}`,
  name: translate("en", NAME_KEY[type]),
  retroType: type,
  content: defaultTemplateContent(type, "en"),
  isDefault: true,
  isActive: true,
  createdAt: EPOCH,
  updatedAt: EPOCH,
}));

/**
 * 사용자가 손대지 않은(어느 언어로든 기본 본문 그대로인) 기본 템플릿만
 * 주어진 locale 의 기본 본문으로 바꾼다. 편집한 템플릿은 그대로 둔다.
 */
export function localizeDefaultTemplates(
  templates: RetroTemplate[],
  locale: Locale,
): RetroTemplate[] {
  // 에디터가 마크다운을 정규화(빈 줄 수 등)해 다시 저장하므로 공백 차이는 무시한다.
  const norm = (md: string) => md.replace(/\s+/g, " ").trim();
  let changed = false;
  const next = templates.map((tpl) => {
    if (!tpl.isDefault) return tpl;
    const key = CONTENT_KEY[tpl.retroType];
    const current = norm(tpl.content);
    const untouched = Object.values(DICTIONARIES).some((dict) => norm(dict[key]) === current);
    const content = defaultTemplateContent(tpl.retroType, locale);
    if (!untouched || tpl.content === content) return tpl;
    changed = true;
    return { ...tpl, content };
  });
  return changed ? next : templates;
}

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
