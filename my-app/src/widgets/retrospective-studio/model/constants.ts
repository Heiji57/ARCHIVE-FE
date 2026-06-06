import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { TranslationKey } from "@/shared/lib/i18n";

/** Number of retro list entries per pagination page. */
export const PAGE_SIZE = 8;

/** Retrospective type filter tabs. */
export interface RetroFilterConfig {
  id: RetrospectiveType;
  labelKey: TranslationKey;
}

export const RETRO_FILTERS: RetroFilterConfig[] = [
  { id: "daily", labelKey: "retro.filter.daily" },
  { id: "weekly", labelKey: "retro.filter.weekly" },
  { id: "monthly", labelKey: "retro.filter.monthly" },
  { id: "yearly", labelKey: "retro.filter.yearly" },
];

export const RETRO_LABEL_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "retro.filter.daily",
  weekly: "retro.filter.weekly",
  monthly: "retro.filter.monthly",
  yearly: "retro.filter.yearly",
};

/** Month numbers for the month <select>. */
export const MONTHS = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
];

// MOCK_COMMITS 는 app/lib/mockGithub.ts 로 이전. 서버 모델 연동 후 state.github.commits 를 사용.
