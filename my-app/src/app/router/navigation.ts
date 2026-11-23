import type { AppRoute } from "@/app/model/types";
import { isSettingsSection, type SettingsSection } from "@/shared/config/settingsSections";

export type { SettingsSection };

const ROUTE_PATHS: Record<AppRoute, string> = {
  ai: "/ai",
  calendar: "/",
  todos: "/todos",
  retrospectives: "/retrospectives",
  // 경로 호환: /dashboard 는 없어졌다(캘린더로). /settings 는 캘린더 위에 설정 시트.
  dashboard: "/",
  settings: "/settings",
};

const PATH_PREFIX_TO_ROUTE: Array<[string, AppRoute]> = [
  ["/ai", "ai"],
  ["/dashboard", "calendar"],
  ["/todos", "todos"],
  ["/retrospectives", "retrospectives"],
  ["/settings", "settings"],
];

export interface RetroRouteParams {
  view?: "editor" | "gallery";
  entryId?: string;
  /** 회고 화면 안의 영역. 없으면 "retro"(회고 목록과 편집기). */
  area?: "retro" | "topic";
  /** area="topic" 일 때 연 주제. 없으면 주제 목록. */
  topicId?: string;
  /** 주제 본문("doc") 또는 연결 그래프("graph"). topicId 가 있을 때만. */
  topicView?: "doc" | "graph";
}

export function getRetroParamsFromPath(pathname: string): RetroRouteParams {
  const match = pathname.match(/^\/retrospectives(?:\/([^/?#]+))?(?:\/([^/?#]+))?(?:\/([^/?#]+))?/);
  if (!match) return {};

  const [, first, second, third] = match;
  if (first === "topics") {
    if (!second) return { area: "topic" };
    const topicId = decodeURIComponent(second);
    return { area: "topic", topicId, topicView: third === "graph" ? "graph" : "doc" };
  }
  if (first === "editor" && second) {
    return { view: "editor", entryId: second };
  }
  if (first === "folder" && second) {
    return { view: "gallery", entryId: second };
  }
  return {};
}

export function getRetroPathFromParams(params: RetroRouteParams): string {
  if (params.area === "topic") {
    if (!params.topicId) return "/retrospectives/topics";
    const base = `/retrospectives/topics/${encodeURIComponent(params.topicId)}`;
    return params.topicView === "graph" ? `${base}/graph` : base;
  }
  if (params.view === "editor" && params.entryId) {
    return `/retrospectives/editor/${params.entryId}`;
  }
  return "/retrospectives";
}

export function getRouteFromPath(pathname: string): AppRoute {
  return (
    PATH_PREFIX_TO_ROUTE.find(
      ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.[1] ?? "calendar"
  );
}

export function getPathFromRoute(route: AppRoute) {
  return ROUTE_PATHS[route];
}

/** `/settings#link` 같은 해시에서 설정 섹션을 읽는다. 없거나 모르는 값은 "account". */
export function getSettingsSectionFromHash(hash: string): SettingsSection {
  const v = hash.replace(/^#/, "");
  return isSettingsSection(v) ? v : "account";
}
