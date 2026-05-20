import type { AppRoute } from "@/app/model/types";

const ROUTE_PATHS: Record<AppRoute, string> = {
  calendar: "/",
  todos: "/todos",
  retrospectives: "/retrospectives",
  settings: "/settings",
};

const PATH_PREFIX_TO_ROUTE: Array<[string, AppRoute]> = [
  ["/todos", "todos"],
  ["/retrospectives", "retrospectives"],
  ["/settings", "settings"],
];

export function getRouteFromPath(pathname: string): AppRoute {
  return (
    PATH_PREFIX_TO_ROUTE.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    "calendar"
  );
}

export function getPathFromRoute(route: AppRoute) {
  return ROUTE_PATHS[route];
}
