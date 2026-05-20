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
import { DndProvider } from "@/shared/lib/dnd";
import { I18nProvider } from "@/shared/lib/i18n";
import { AppShell } from "@/widgets/app-shell/ui/AppShell";
import { ToastViewport } from "@/widgets/notifications/ui/ToastViewport";
import { SummaryFloatingChip } from "@/widgets/summary/ui/SummaryFloatingChip";
import { SummaryOverlay } from "@/widgets/summary/ui/SummaryOverlay";

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
      <LocalizedShell route={route} onNavigate={navigate} />
    </AppProvider>
  );
}

function LocalizedShell({
  route,
  onNavigate,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}) {
  const { state } = useArchiveApp();
  return (
    <I18nProvider locale={state.settings.locale}>
      <DndProvider>
        <AppContent route={route} onNavigate={onNavigate} />
      </DndProvider>
    </I18nProvider>
  );
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
