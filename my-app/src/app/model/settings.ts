export type Locale = "ko" | "en" | "zh" | "ja";

export interface AutoSummarySettings {
  weekly: boolean;
  monthly: boolean;
  yearly: boolean;
}

export interface AppSettings {
  locale: Locale;
  autoSummary: AutoSummarySettings;
  notificationRetentionDays: number;
  lastScheduleCheckAt: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  locale: "ko",
  autoSummary: { weekly: true, monthly: true, yearly: true },
  notificationRetentionDays: 30,
  lastScheduleCheckAt: null,
};

export const SUPPORTED_LOCALES: Array<{ code: Locale; label: string; native: string }> = [
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "en", label: "English", native: "English" },
  { code: "zh", label: "Chinese (Simplified)", native: "中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
];
