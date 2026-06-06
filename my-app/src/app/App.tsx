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
import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login/ui/LoginPage";
import { OnboardingPage } from "@/pages/onboarding/ui/OnboardingPage";
import { ResetPasswordPage } from "@/pages/reset-password/ui/ResetPasswordPage";
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
    // 데모(게스트) 모드에서는 ?demo=true 를 유지해야 nav 이동 시 로그인으로 튕기지 않는다.
    const isDemo =
      new URLSearchParams(window.location.search).get("demo") === "true";
    const target = isDemo ? `${nextPath}?demo=true` : nextPath;
    if (window.location.pathname + window.location.search !== target) {
      window.history.pushState({}, "", target);
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

  // ?demo=true → 인증 없이 앱 직접 실행
  const isDemoMode = new URLSearchParams(window.location.search).get("demo") === "true";

  // Auth 경로로 접근했는데 이미 로그인 → 메인으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && resolved.kind === "auth") {
      navigateApp("calendar");
    }
  }, [isAuthenticated, resolved, navigateApp]);

  // 미인증 + 앱 경로 접근 + 루트("/") → 랜딩 페이지 (리다이렉트 없음)
  // 미인증 + 앱 경로 접근 + 루트 외 → 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (
      !isAuthenticated &&
      !isDemoMode &&
      resolved.kind === "app" &&
      window.location.pathname !== "/"
    ) {
      navigateAuth("login");
    }
  }, [isAuthenticated, isDemoMode, resolved, navigateAuth]);

  // 데모 모드: 인증 없이 앱 실행
  if (isDemoMode) {
    const appRoute = resolved.kind === "app" ? resolved.route : "calendar";
    return <AppContent route={appRoute} onNavigate={navigateApp} isDemo />;
  }

  if (!isAuthenticated) {
    // 루트 "/" → 랜딩 페이지
    if (resolved.kind === "app" && window.location.pathname === "/") {
      return (
        <LandingPage
          onNavigateAuth={navigateAuth}
          onNavigateApp={navigateApp}
        />
      );
    }

    const authRoute = resolved.kind === "auth" ? resolved.route : "login";
    switch (authRoute) {
      case "login":
        return <LoginPage onAuthNavigate={navigateAuth} />;
      case "signup":
        return <SignupPage onAuthNavigate={navigateAuth} />;
      case "forgot-password":
        return <ForgotPasswordPage onAuthNavigate={navigateAuth} />;
      case "reset-password":
        return <ResetPasswordPage onAuthNavigate={navigateAuth} />;
      case "onboarding":
        return <OnboardingPage onAuthNavigate={navigateAuth} />;
    }
  }

  const appRoute = resolved.kind === "app" ? resolved.route : "calendar";
  return <AppContent route={appRoute} onNavigate={navigateApp} />;
}

function AppContent({
  route,
  onNavigate,
  isDemo = false,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isDemo?: boolean;
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
      {isDemo && <DemoBanner />}
    </>
  );
}

function DemoBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="lp-demo-banner">
      <span className="lp-demo-banner-label">
        <span className="lp-demo-banner-dot" />
        데모 모드 — 변경사항은 저장되지 않습니다
      </span>
      <a
        href="/signup"
        className="btn btn-primary"
        style={{ fontSize: 12, padding: "6px 14px" }}
      >
        무료로 시작 →
      </a>
      <button
        type="button"
        className="btn-icon"
        onClick={() => setHidden(true)}
        aria-label="닫기"
        style={{ fontSize: 14 }}
      >
        ✕
      </button>
    </div>
  );
}
