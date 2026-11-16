import { createContext, useContext } from "react";
import type { SettingsSection } from "@/shared/config/settingsSections";

export type { SettingsSection };
export { SETTINGS_SECTIONS } from "@/shared/config/settingsSections";

export interface SettingsSheetApi {
  /** 설정 시트를 연다(이미 열려 있으면 섹션만 바꾼다). 섹션을 안 주면 "account". */
  open(section?: SettingsSection): void;
  close(): void;
  /** 열린 섹션. 닫혀 있으면 null. */
  section: SettingsSection | null;
}

export const SettingsSheetCtx = createContext<SettingsSheetApi | null>(null);

/** 설정 시트 열기/닫기. 사용자 메뉴의 "설정", Ctrl+, , `/settings#<section>` 이 이것을 쓴다. */
export function useSettingsSheet(): SettingsSheetApi {
  const v = useContext(SettingsSheetCtx);
  if (!v) throw new Error("useSettingsSheet must be used inside AppShell");
  return v;
}
