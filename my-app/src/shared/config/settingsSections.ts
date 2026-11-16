/** 설정 시트의 섹션. `/settings#<section>` 해시와 같은 이름. */
export type SettingsSection = "account" | "general" | "work" | "retro" | "ai" | "link" | "notify" | "data";

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  "account",
  "general",
  "work",
  "retro",
  "ai",
  "link",
  "notify",
  "data",
];

export function isSettingsSection(v: string): v is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(v);
}
