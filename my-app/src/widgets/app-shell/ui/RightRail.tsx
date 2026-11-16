import type { ReactNode } from "react";
import { Bell, CalendarDays } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE, RetroIcon, SparkIcon } from "@/shared/ui/icons";
import { isAiTabAvailable, listRightRailItems, useRightPanel } from "../model/rightPanel";
import { useShell } from "../model/shellSlots";
import { useRightPanelContext } from "./useRightPanelCtx";

/**
 * 오른쪽 아이콘 줄(시안 planner.js strip). 위에서부터 패널 버튼, AI 추천(등록됐을 때),
 * 등록된 추가 버튼(오늘 마무리 등), 알림 벨. 캘린더와 할 일 화면에만 있다.
 */
export function RightRail() {
  const { t } = useTranslation();
  const { state } = useArchiveApp();
  const panel = useRightPanel();
  const ctx = useRightPanelContext();
  const { notificationsOpen, openNotifications, closeNotifications } = useShell();
  const unread = state.notifications.filter((n) => !n.read && !n.transient).length;
  const PanelIcon = ctx.route === "todos" ? CalendarDays : RetroIcon;
  const onRow = panel.open && panel.tab !== "ai";

  return (
    <nav className="sh-strip" aria-label={t("shell.rail.label")}>
      <button
        type="button"
        className="sh-strip-b"
        aria-pressed={onRow}
        aria-label={t("shell.rail.panel")}
        title={t("shell.rail.panel")}
        onClick={() => (onRow ? panel.close() : panel.setTab(panel.tab === "ai" ? "day" : panel.tab))}
      >
        <PanelIcon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      {isAiTabAvailable(ctx) ? (
        <button
          type="button"
          className="sh-strip-b"
          aria-pressed={panel.open && panel.tab === "ai"}
          aria-label={t("shell.rail.aiSuggest")}
          title={t("shell.rail.aiSuggest")}
          onClick={() => panel.toggle("ai")}
        >
          <SparkIcon size={16} aria-hidden="true" />
        </button>
      ) : null}
      {listRightRailItems(ctx).map(({ id, def }) => (
        <RailItem key={id} render={def.render} />
      ))}
      <button
        type="button"
        className="sh-strip-b"
        data-ntrig=""
        aria-haspopup="dialog"
        aria-expanded={notificationsOpen}
        aria-label={unread ? t("shell.notif.triggerUnread", { n: unread }) : t("shell.notif.trigger")}
        onClick={() => (notificationsOpen ? closeNotifications() : openNotifications())}
      >
        <Bell size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
        {unread ? <span className="sh-bd" aria-hidden="true" /> : null}
      </button>
    </nav>
  );
}

function RailItem({ render }: { render: () => ReactNode }) {
  return <>{render()}</>;
}
