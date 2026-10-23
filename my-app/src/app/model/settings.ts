export type Locale =
  | "ko"
  | "en"
  | "zh"
  | "zh-TW"
  | "ja"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "it"
  | "ru"
  | "vi"
  | "th"
  | "id"
  | "hi"
  | "tr";
export type AccountType = "developer" | "user";

export interface AutoSummarySettings {
  weekly: boolean;
  monthly: boolean;
  yearly: boolean;
}

/**
 * 할 일 보드 "전체" 보기 범위. 오늘을 기준으로 지난 일과 앞으로의 일을 각각 며칠까지
 * 보여줄지 정한다(0 이면 그쪽은 오늘까지만).
 */
export interface TodoBoardRange {
  pastDays: number;
  futureDays: number;
}

export interface AppSettings {
  locale: Locale;
  autoSummary: AutoSummarySettings;
  notificationRetentionDays: number;
  /**
   * 할 일 보드 "전체" 보기 범위(오늘 기준 지난/앞으로 일수).
   * FE 전용(로컬 저장) — 서버로 동기화하지 않는다.
   */
  todoBoardRange: TodoBoardRange;
  lastScheduleCheckAt: string | null;
  /** 신규 할 일 생성 시 기본으로 Google Calendar 에 push할지. */
  calendarAutoPushTodo: boolean;
  /** Google Calendar 에서 일정 삭제 시 연동 할 일도 함께 삭제할지. */
  calendarAutoDeleteTodo: boolean;
  accountType: AccountType;
  /** true once the user has seen and confirmed/skipped the account type screen */
  accountTypeDetermined: boolean;
  /**
   * 리치 에디터(회고록 본문 등)의 브라우저 맞춤법 검사(빨간 밑줄) 표시 여부.
   * api.yaml /settings 계약에 없는 FE 전용 로컬 선호도 — todoBoardRange 와 동일하게
   * 서버로 동기화하지 않고 localStorage 에만 저장한다.
   */
  spellCheck: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  locale: "en",
  autoSummary: { weekly: true, monthly: true, yearly: true },
  notificationRetentionDays: 30,
  todoBoardRange: { pastDays: 30, futureDays: 30 },
  lastScheduleCheckAt: null,
  calendarAutoPushTodo: false,
  calendarAutoDeleteTodo: false,
  accountType: "user",
  accountTypeDetermined: false,
  spellCheck: true,
};

export const SUPPORTED_LOCALES: Array<{ code: Locale; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "zh", label: "Chinese (Simplified)", native: "简体中文" },
  { code: "zh-TW", label: "Chinese (Traditional)", native: "繁體中文" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];
