import { useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  ListTodo,
  LogOut,
  Settings,
} from "lucide-react";
import type { AppRoute } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import type { TranslationKey } from "@/shared/lib/i18n";
import { GlobalSearch } from "@/widgets/global-search";
import { NotificationPanel } from "@/widgets/notifications";

interface AppShellProps {
  route: AppRoute;
  children: ReactNode;
  onNavigate: (route: AppRoute) => void;
}

const ROUTE_META: Record<
  AppRoute,
  { eyebrow: TranslationKey; title: TranslationKey; subtitle: TranslationKey }
> = {
  calendar: {
    eyebrow: "subheader.calendar.eyebrow",
    title: "subheader.calendar.title",
    subtitle: "subheader.calendar.subtitle",
  },
  todos: {
    eyebrow: "subheader.todos.eyebrow",
    title: "subheader.todos.title",
    subtitle: "subheader.todos.subtitle",
  },
  retrospectives: {
    eyebrow: "subheader.retrospectives.eyebrow",
    title: "subheader.retrospectives.title",
    subtitle: "subheader.retrospectives.subtitle",
  },
  settings: {
    eyebrow: "subheader.settings.eyebrow",
    title: "subheader.settings.title",
    subtitle: "subheader.settings.subtitle",
  },
};

const NAV_ITEMS: Array<{
  route: AppRoute;
  labelKey: TranslationKey;
  icon: typeof Calendar;
}> = [
  { route: "calendar", labelKey: "nav.calendar", icon: Calendar },
  { route: "todos", labelKey: "nav.todos", icon: ListTodo },
  { route: "retrospectives", labelKey: "nav.retrospectives", icon: BookOpen },
  { route: "settings", labelKey: "nav.settings", icon: Settings },
];

export function AppShell({ route, children, onNavigate }: AppShellProps) {
  const { state, logout } = useArchiveApp();
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const meta = ROUTE_META[route];
  const currentUser = state.currentUser;
  const initial = currentUser?.displayName?.[0]?.toUpperCase() ?? "?";

  const isGithubConnected = Boolean(
    state.githubConfig && state.githubConfig.enabled,
  );
  const minsAgo =
    state.githubConfig?.lastSyncedAt
      ? Math.max(
          1,
          Math.round(
            (Date.now() -
              new Date(state.githubConfig.lastSyncedAt).getTime()) /
              60000,
          ),
        )
      : 0;

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="app-shell-root">
      {/* Global Nav */}
      <nav className="global-nav" aria-label="Primary">
        <div className="global-nav-inner">
          <button
            type="button"
            className="gn-brand"
            onClick={() => onNavigate("calendar")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 36 32"
              className="gn-brand-mark"
              aria-hidden="true"
            >
              <path d="M 22 4 L 33 9 L 33 19 L 22 14 Z" fill="#f5f5f7" opacity="0.5" />
              <path d="M 33 9 L 35 10 L 35 20 L 33 19 Z" fill="#f5f5f7" opacity="0.3" />
              <path d="M 16 9 L 27 14 L 27 23 L 16 18 Z" fill="#f5f5f7" opacity="0.72" />
              <path d="M 27 14 L 29 15 L 29 24 L 27 23 Z" fill="#f5f5f7" opacity="0.42" />
              <path d="M 10 14 L 21 19 L 21 28 L 10 23 Z" fill="#0a84ff" />
              <path d="M 21 19 L 23 20 L 23 29 L 21 28 Z" fill="#0a84ff" opacity="0.62" />
              <path d="M 4 21 L 15 26 L 15 31 L 4 26 Z" fill="#f5f5f7" opacity="0.32" />
              <path d="M 15 26 L 23 23 L 23 28 L 15 31 Z" fill="#f5f5f7" opacity="0.2" />
            </svg>
            <span>{t("nav.brand")}</span>
          </button>

          <div className="gn-links" role="tablist">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = route === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  className="gn-link"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNavigate(item.route)}
                >
                  <Icon size={14} />
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>

          <div className="gn-right">
            <div
              className="sync-chip"
              title={
                isGithubConnected
                  ? t("sync.minutesAgo", { n: minsAgo })
                  : t("sync.disconnected")
              }
            >
              <span
                className={`sync-dot ${isGithubConnected ? "" : "offline"}`}
              />
              <span>
                {isGithubConnected
                  ? t("sync.synced", { n: minsAgo })
                  : t("sync.offline")}
              </span>
            </div>

            <GlobalSearch onNavigate={onNavigate} />

            <button
              type="button"
              className="btn-icon"
              aria-label={t("notif.panel.title")}
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={16} />
              {unreadCount > 0 ? <span className="badge-dot" /> : null}
            </button>

            {currentUser ? (
              <span className="user-chip" title={currentUser.email}>
                <span className="user-avatar">{initial}</span>
                <span>{currentUser.displayName}</span>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={t("auth.header.logout")}
                  title={t("auth.header.logout")}
                  onClick={() => logout()}
                >
                  <LogOut size={14} />
                </button>
              </span>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Sub-header */}
      <header className="sub-header">
        <div className="sub-header-inner">
          <div className="sub-header-text">
            <p className="t-eyebrow sub-header-eyebrow">{t(meta.eyebrow)}</p>
            <h1 className="t-hero sub-header-title">{t(meta.title)}</h1>
            <p className="sub-header-sub">{t(meta.subtitle)}</p>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="app-shell-main">{children}</main>

      {/* Notification panel */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
