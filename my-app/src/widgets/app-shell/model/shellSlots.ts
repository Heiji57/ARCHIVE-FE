import { createContext, useContext } from "react";
import type { AppRoute } from "@/app/model/types";
import type { RetroRouteParams } from "@/app/router/navigation";

/** AppShell 이 ShellPage 에 내려 주는 셸 상태. 페이지는 ShellPage 의 props 로 슬롯을 채운다. */
export interface ShellState {
  /** 지금 화면(상단 탭 표시 기준). "dashboard"/"settings" 는 "calendar" 로 들어온다. */
  route: AppRoute;
  navigate(route: AppRoute): void;
  navigateRetro(params: RetroRouteParams): void;
  /** 사이드바가 아이콘 레일로 접혀 있는지. */
  collapsed: boolean;
  toggleSidebar(): void;
  openPalette(): void;
  openNotifications(): void;
  closeNotifications(): void;
  notificationsOpen: boolean;
  openKeys(): void;
}

export const ShellCtx = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const v = useContext(ShellCtx);
  if (!v) throw new Error("useShell must be used inside AppShell");
  return v;
}
