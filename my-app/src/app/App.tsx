import { startTransition, useEffect, useMemo, useState } from "react";
import type { AppRoute } from "@/app/model/types";
import { AppProvider } from "@/app/providers/AppProvider";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import {
  getPathFromRoute,
  getRouteFromPath,
} from "@/app/router/navigation";
import { CalendarPage } from "@/pages/calendar/ui/CalendarPage";
import { RetrospectivesPage } from "@/pages/retrospectives/ui/RetrospectivesPage";
import { SettingsPage } from "@/pages/settings/ui/SettingsPage";
import { TodosPage } from "@/pages/todos/ui/TodosPage";
import { AppShell } from "@/widgets/app-shell/ui/AppShell";
import { ToastViewport } from "@/widgets/notifications/ui/ToastViewport";

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    getRouteFromPath(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        setRoute(getRouteFromPath(window.location.pathname));
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    const nextPath = getPathFromRoute(nextRoute);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    startTransition(() => {
      setRoute(nextRoute);
    });
  };

  return (
    <AppProvider>
      <AppContent route={route} onNavigate={navigate} />
    </AppProvider>
  );
}

function AppContent({
  route,
  onNavigate,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}) {
  const { state, dismissNotification } = useArchiveApp();
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
      <ToastViewport
        notifications={state.notifications}
        onDismiss={dismissNotification}
      />
    </>
  );
}
