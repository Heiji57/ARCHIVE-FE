import { SETTINGS_SECTIONS, type SettingsSection } from "@/shared/config/settingsSections";
import type { TranslationKey } from "@/shared/lib/i18n";
import { isServerFeatureOn, type ServerFeature } from "@/shared/lib/serverFeatures";

/**
 * 설정 시트의 줄 목록(시안 d-settings.html 의 R 배열). 찾기와 섹션 그리기가 같이 쓴다.
 * - kind: show(바로 보이는 줄), more(접힌 줄, 세부 설정), block(묶음 블록)
 * - feature: 서버(api.yaml)에 없어서 실제 모드에서 숨기는 줄
 * - needs: 연결돼 있어야 의미가 있는 줄(GitHub, Google Calendar)
 */
export interface SettingsRowDef {
  id: string;
  section: SettingsSection;
  kind: "show" | "more" | "block";
  title: TranslationKey;
  desc?: TranslationKey;
  /** 찾기 전용 낱말 */
  kw: TranslationKey;
  feature?: ServerFeature;
  needs?: "github" | "calendar";
}

export interface RowVisibility {
  demo: boolean;
  github: boolean;
  calendar: boolean;
}

const R = (
  id: string,
  section: SettingsSection,
  kind: SettingsRowDef["kind"],
  extra: Partial<SettingsRowDef> = {},
): SettingsRowDef => ({
  id,
  section,
  kind,
  title: `settingsSheet.row.${id}.t` as TranslationKey,
  kw: `settingsSheet.row.${id}.kw` as TranslationKey,
  ...extra,
});
const d = (id: string) => `settingsSheet.row.${id}.d` as TranslationKey;

export const SETTINGS_ROWS: readonly SettingsRowDef[] = [
  // 계정
  R("name", "account", "show", { desc: d("name") }),
  R("email", "account", "show", { desc: d("email") }),
  R("logout", "account", "show", { desc: d("logout") }),
  R("delete", "account", "more", { desc: d("delete"), feature: "accountDelete" }),
  // 일반
  R("lang", "general", "show", { desc: d("lang") }),
  R("region", "general", "show", { desc: d("region") }),
  R("startTab", "general", "more", { desc: d("startTab"), feature: "settingsExt" }),
  R("timeFmt", "general", "more", { feature: "settingsExt" }),
  // 할 일과 캘린더
  R("workHours", "work", "block", { desc: d("workHours"), feature: "settingsExt" }),
  R("todoDefaults", "work", "block", { feature: "settingsExt" }),
  R("weekStart", "work", "show", { desc: d("weekStart"), feature: "settingsExt" }),
  R("todoRange", "work", "show", { desc: d("todoRange") }),
  R("calendars", "work", "block", { feature: "userCalendars" }),
  R("tags", "work", "block", { feature: "tagAdmin" }),
  // 회고
  R("templates", "retro", "block", { desc: d("templates") }),
  R("autoSummary", "retro", "block", { desc: d("autoSummary") }),
  R("dayEnd", "retro", "block", { desc: d("dayEnd"), feature: "settingsExt" }),
  R("folder", "retro", "show", { desc: d("folder"), feature: "settingsExt" }),
  R("spell", "retro", "show", { desc: d("spell") }),
  // AI 비서 (전부 서버에 없음)
  R("pet", "ai", "show", { desc: d("pet"), feature: "ai" }),
  R("tools", "ai", "show", { desc: d("tools"), feature: "ai" }),
  R("confirm", "ai", "more", { desc: d("confirm"), feature: "ai" }),
  R("style", "ai", "more", { desc: d("style"), feature: "ai" }),
  R("memo", "ai", "more", { desc: d("memo"), feature: "ai" }),
  R("sched", "ai", "more", { desc: d("sched"), feature: "ai" }),
  R("history", "ai", "more", { desc: d("history"), feature: "ai" }),
  // 연동
  R("github", "link", "block"),
  R("gcal", "link", "block"),
  R("repos", "link", "more", { desc: d("repos"), needs: "github" }),
  R("push", "link", "more", { desc: d("push"), needs: "github" }),
  R("gPush", "link", "more", { desc: d("gPush"), needs: "calendar" }),
  R("gDel", "link", "more", { desc: d("gDel"), needs: "calendar" }),
  // 알림
  R("kinds", "notify", "show", { desc: d("kinds"), feature: "notificationPrefs" }),
  R("keep", "notify", "show", { desc: d("keep") }),
  R("browser", "notify", "more", { desc: d("browser"), feature: "settingsExt" }),
  R("dnd", "notify", "more", { desc: d("dnd"), feature: "notificationPrefs" }),
  R("mail", "notify", "more", { desc: d("mail"), feature: "notificationPrefs" }),
  // 데이터와 보안
  R("devices", "data", "block", { desc: d("devices") }),
  R("export", "data", "block", { desc: d("export"), feature: "exports" }),
  R("trash", "data", "more", { desc: d("trash"), feature: "trash" }),
];

export function isRowVisible(row: SettingsRowDef, v: RowVisibility): boolean {
  if (row.feature && !isServerFeatureOn(row.feature, { demo: v.demo })) return false;
  if (row.needs === "github" && !v.github) return false;
  if (row.needs === "calendar" && !v.calendar) return false;
  return true;
}

export function visibleRows(section: SettingsSection, v: RowVisibility): SettingsRowDef[] {
  return SETTINGS_ROWS.filter((r) => r.section === section && isRowVisible(r, v));
}

/** 보일 줄이 하나라도 있는 섹션만(실제 모드에서는 AI 비서가 빠진다). */
export function visibleSections(v: RowVisibility): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((s) => visibleRows(s, v).length > 0);
}

export function rowById(id: string): SettingsRowDef | undefined {
  return SETTINGS_ROWS.find((r) => r.id === id);
}

export const SECTION_LABEL: Record<SettingsSection, TranslationKey> = {
  account: "shell.settings.section.account",
  general: "shell.settings.section.general",
  work: "shell.settings.section.work",
  retro: "shell.settings.section.retro",
  ai: "shell.settings.section.ai",
  link: "shell.settings.section.link",
  notify: "shell.settings.section.notify",
  data: "shell.settings.section.data",
};
