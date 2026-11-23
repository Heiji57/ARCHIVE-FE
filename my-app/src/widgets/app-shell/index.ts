export { AppShell } from "./ui/AppShell";
export { ShellPage, type ShellPageProps } from "./ui/ShellPage";
export {
  useRightPanel,
  registerRightPanelTab,
  registerRightRailItem,
  RIGHT_PANEL_TABS,
  type RightPanelTab,
  type RightPanelTabDef,
  type RightPanelContext,
  type RightRailItemDef,
  type RightPanelApi,
} from "./model/rightPanel";
export {
  useSettingsSheet,
  SETTINGS_SECTIONS,
  type SettingsSection,
  type SettingsSheetApi,
} from "./model/settingsSheet";
export { useShell, type ShellState } from "./model/shellSlots";
