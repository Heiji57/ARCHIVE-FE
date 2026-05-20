import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  ListTodo,
  Search,
  Settings,
} from "lucide-react";
import type { AppRoute } from "@/app/model/types";
import { useArchiveApp } from "@/app/providers/useArchiveApp";

interface AppShellProps {
  route: AppRoute;
  children: ReactNode;
  onNavigate: (route: AppRoute) => void;
}

const ROUTE_META: Record<
  AppRoute,
  { eyebrow: string; title: string; subtitle: string }
> = {
  calendar: {
    eyebrow: "Planning Canvas",
    title: "오늘의 캘린더",
    subtitle:
      "일정과 작업을 한 화면에서 살펴봅니다. 작업 카드를 누르면 우측에서 디테일이 펼쳐집니다.",
  },
  todos: {
    eyebrow: "Quick Capture",
    title: "Editorial Kanban",
    subtitle:
      "자연어로 적는 순간 칸반에 정렬됩니다. 시작 전 / 진행 중 / 완료 세 열로 흐름을 정리하세요.",
  },
  retrospectives: {
    eyebrow: "Writing Ledger",
    title: "Retrospectives",
    subtitle:
      "완료한 작업과 오늘의 커밋을 한 흐름으로 묶고, GitHub 저장소에 자동 동기화합니다.",
  },
  settings: {
    eyebrow: "Integrations and Templates",
    title: "Settings",
    subtitle:
      "GitHub 연결 범위와, AI 자동 회고 템플릿을 자유롭게 조정합니다.",
  },
};

const NAV_ITEMS: Array<{
  route: AppRoute;
  label: string;
  icon: typeof Calendar;
}> = [
  { route: "calendar", label: "Calendar", icon: Calendar },
  { route: "todos", label: "To-Dos", icon: ListTodo },
  { route: "retrospectives", label: "Retrospectives", icon: BookOpen },
  { route: "settings", label: "Settings", icon: Settings },
];

export function AppShell({ route, children, onNavigate }: AppShellProps) {
  const { state } = useArchiveApp();
  const meta = ROUTE_META[route];
  const syncEnabled = state.githubConfig?.enabled ?? false;
  const minsAgo = state.githubConfig?.lastSyncedAt
    ? Math.max(
        1,
        Math.round((Date.now() - new Date(state.githubConfig.lastSyncedAt).getTime()) / 60000),
      )
    : 0;

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
            <span>A.R.C.H.I.V.E</span>
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
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="gn-right">
            <div
              className="sync-chip"
              title={syncEnabled ? `${minsAgo}분 전 동기화됨` : "동기화 끊김"}
            >
              <span className={`sync-dot ${syncEnabled ? "" : "offline"}`} />
              <span>{syncEnabled ? `Synced · ${minsAgo}m` : "Offline"}</span>
            </div>
            <button type="button" className="btn-icon" aria-label="Search">
              <Search size={16} />
            </button>
            <button type="button" className="btn-icon" aria-label="Notifications">
              <Bell size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Sub-header */}
      <header className="sub-header">
        <div className="sub-header-inner">
          <div className="sub-header-text">
            <p className="t-eyebrow sub-header-eyebrow">{meta.eyebrow}</p>
            <h1 className="t-hero sub-header-title">{meta.title}</h1>
            <p className="sub-header-sub">{meta.subtitle}</p>
          </div>
          <div className="sub-header-right">
            <SyncStatusCard
              syncEnabled={syncEnabled}
              connectedAs={state.githubConfig?.connectedAs ?? "developer"}
              minsAgo={minsAgo}
            />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="app-shell-main">{children}</main>
    </div>
  );
}

function SyncStatusCard({
  syncEnabled,
  connectedAs,
  minsAgo,
}: {
  syncEnabled: boolean;
  connectedAs: string;
  minsAgo: number;
}) {
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
          Sync Status
        </p>
        <span className={`sync-dot ${syncEnabled ? "" : "offline"}`} />
      </div>
      <p
        style={{
          margin: "8px 0 2px",
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "-0.2px",
        }}
      >
        {syncEnabled ? "GitHub 연결됨" : "연결 없음"}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--color-body-muted)" }}>
        {syncEnabled
          ? `@${connectedAs} · ${minsAgo}분 전 동기화`
          : "Settings에서 연결하세요"}
      </p>
    </div>
  );
}
