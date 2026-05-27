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
            <span className="gn-logo">A</span>
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
                  style={{ marginLeft: 2 }}
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
          <div className="sub-header-right">
            <SyncStatusCard
              isConnected={isGithubConnected}
              connectedAs={state.githubConfig?.connectedAs ?? ""}
              minsAgo={minsAgo}
            />
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

function SyncStatusCard({
  isConnected,
  connectedAs,
  minsAgo,
}: {
  isConnected: boolean;
  connectedAs: string;
  minsAgo: number;
}) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        background: "var(--color-tile-2)",
        borderRadius: "var(--r-lg)",
        padding: "16px 20px",
        minWidth: 248,
        border: "1px solid var(--color-divider-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <p
          className="t-eyebrow"
          style={{ color: "var(--color-body-muted)", margin: 0 }}
        >
          {t("sync.status")}
        </p>
        <span className={`sync-dot ${isConnected ? "" : "offline"}`} />
      </div>
      <p
        style={{
          margin: "8px 0 2px",
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "-0.2px",
        }}
      >
        {isConnected ? t("sync.connected") : t("sync.disconnected")}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--color-body-muted)" }}>
        {isConnected
          ? `@${connectedAs} · ${t("sync.minutesAgo", { n: minsAgo })}`
          : t("sync.connectInSettings")}
      </p>
    </div>
  );
}
