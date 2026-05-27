import { startTransition, useEffect, useMemo, useState } from "react";
import type { AppRoute } from "@/app/model/types";
import { AppProvider } from "@/app/providers/AppProvider";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import {
  getAuthRouteFromPath,
  getPathFromAuthRoute,
  isAuthPath,
  type AuthRoute,
} from "@/app/router/authRoute";
import {
  getPathFromRoute,
  getRouteFromPath,
} from "@/app/router/navigation";
import { CalendarPage } from "@/pages/calendar/ui/CalendarPage";
import { ForgotPasswordPage } from "@/pages/forgot-password/ui/ForgotPasswordPage";
import { LoginPage } from "@/pages/login/ui/LoginPage";
import { RetrospectivesPage } from "@/pages/retrospectives/ui/RetrospectivesPage";
import { SettingsPage } from "@/pages/settings/ui/SettingsPage";
import { SignupPage } from "@/pages/signup/ui/SignupPage";
import { TodosPage } from "@/pages/todos/ui/TodosPage";
import { DndProvider } from "@/shared/lib/dnd";
import { I18nProvider } from "@/shared/lib/i18n";
import { AppShell } from "@/widgets/app-shell";
import { ToastViewport } from "@/widgets/notifications";
import { SummaryFloatingChip, SummaryOverlay } from "@/widgets/summary";

type ResolvedRoute =
  | { kind: "auth"; route: AuthRoute }
  | { kind: "app"; route: AppRoute };

function resolveRoute(pathname: string): ResolvedRoute {
  if (isAuthPath(pathname)) {
    return { kind: "auth", route: getAuthRouteFromPath(pathname) };
  }
  return { kind: "app", route: getRouteFromPath(pathname) };
}

export default function App() {
  const [resolved, setResolved] = useState<ResolvedRoute>(() =>
    resolveRoute(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        setResolved(resolveRoute(window.location.pathname));
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateApp = (nextRoute: AppRoute) => {
    const nextPath = getPathFromRoute(nextRoute);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    startTransition(() => {
      setResolved({ kind: "app", route: nextRoute });
    });
  };

  const navigateAuth = (nextRoute: AuthRoute) => {
    const nextPath = getPathFromAuthRoute(nextRoute);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    startTransition(() => {
      setResolved({ kind: "auth", route: nextRoute });
    });
  };

  return (
    <AppProvider>
      <LocalizedShell
        resolved={resolved}
        navigateApp={navigateApp}
        navigateAuth={navigateAuth}
      />
    </AppProvider>
  );
}

function LocalizedShell({
  resolved,
  navigateApp,
  navigateAuth,
}: {
  resolved: ResolvedRoute;
  navigateApp: (route: AppRoute) => void;
  navigateAuth: (route: AuthRoute) => void;
}) {
  const { state } = useArchiveApp();
  return (
    <I18nProvider locale={state.settings.locale}>
      <DndProvider>
        <AuthGate
          resolved={resolved}
          navigateApp={navigateApp}
          navigateAuth={navigateAuth}
        />
      </DndProvider>
    </I18nProvider>
  );
}

/**
 * 인증 상태에 따라 분기:
 * - 로그인 안 된 상태 → /login, /signup, /forgot-password 만 허용 (그 외는 /login으로 강제)
 * - 로그인 된 상태 → 앱 라우트 렌더링 (auth 경로 접근 시 / 로 리다이렉트)
 */
function AuthGate({
  resolved,
  navigateApp,
  navigateAuth,
}: {
  resolved: ResolvedRoute;
  navigateApp: (route: AppRoute) => void;
  navigateAuth: (route: AuthRoute) => void;
}) {
  const { state } = useArchiveApp();
  const isAuthenticated = state.currentUser !== null;

  // Auth 경로로 접근했는데 이미 로그인 → 메인으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && resolved.kind === "auth") {
      navigateApp("calendar");
    }
  }, [isAuthenticated, resolved, navigateApp]);

  // 미인증 + 앱 경로 접근 → 로그인 페이지로 강제 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && resolved.kind === "app") {
      navigateAuth("login");
    }
  }, [isAuthenticated, resolved, navigateAuth]);

  if (!isAuthenticated) {
    const authRoute = resolved.kind === "auth" ? resolved.route : "login";
    switch (authRoute) {
      case "login":
        return <LoginPage onAuthNavigate={navigateAuth} />;
      case "signup":
        return <SignupPage onAuthNavigate={navigateAuth} />;
      case "forgot-password":
        return <ForgotPasswordPage onAuthNavigate={navigateAuth} />;
    }
  }

  const appRoute = resolved.kind === "app" ? resolved.route : "calendar";
  return <AppContent route={appRoute} onNavigate={navigateApp} />;
}

function AppContent({
  route,
  onNavigate,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}) {
  const { state } = useArchiveApp();
  const pages = useMemo(
    () => ({
      calendar: <CalendarPage onNavigate={onNavigate} />,
      todos: <TodosPage />,
      retrospectives: <RetrospectivesPage />,
      settings: <SettingsPage />,
    }),
    [onNavigate],
  );

  return (
    <>
      <AppShell route={route} onNavigate={onNavigate}>
        {pages[route]}
      </AppShell>
      <ToastViewport notifications={state.notifications} />
      <SummaryOverlay />
      <SummaryFloatingChip />
    </>
  );
}
