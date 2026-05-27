export type AuthRoute = "login" | "signup" | "forgot-password";

const AUTH_ROUTE_PATHS: Record<AuthRoute, string> = {
  login: "/login",
  signup: "/signup",
  "forgot-password": "/forgot-password",
};

const AUTH_PATH_TO_ROUTE: Array<[string, AuthRoute]> = [
  ["/login", "login"],
  ["/signup", "signup"],
  ["/forgot-password", "forgot-password"],
];

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATH_TO_ROUTE.some(([prefix]) => pathname.startsWith(prefix));
}

export function getAuthRouteFromPath(pathname: string): AuthRoute {
  return (
    AUTH_PATH_TO_ROUTE.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    "login"
  );
}

export function getPathFromAuthRoute(route: AuthRoute): string {
  return AUTH_ROUTE_PATHS[route];
}
