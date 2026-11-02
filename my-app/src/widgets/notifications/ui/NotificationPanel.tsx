import { useMemo } from "react";
import { CheckCircle, Info, Trash2, TriangleAlert, X } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type {
  NoticeType,
  NotificationItem,
} from "@/entities/notification/model/types";
import { formatRelativeTime } from "@/shared/lib/date";
import { useTranslation } from "@/shared/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ICON_BY_TYPE: Record<NoticeType, typeof CheckCircle> = {
  success: CheckCircle,
  info: Info,
  warning: TriangleAlert,
};

export function NotificationPanel({ open, onClose }: Props) {
  const {
    state,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    clearReadNotifications,
    clearAllNotifications,
  } = useArchiveApp();
  const { t } = useTranslation();

  const sorted = useMemo(
    () =>
      // transient(네트워크 오류 등)은 토스트로만 노출하고 패널에는 표시하지 않는다.
      state.notifications
        .filter((n) => !n.transient)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
    [state.notifications],
  );
  const unread = sorted.filter((n) => !n.read).length;
  const retention = state.settings.notificationRetentionDays;

  return (
    <div
      className="side-panel-root"
      data-open={open}
      aria-hidden={!open}
      role="dialog"
    >
      <div className="side-panel-backdrop" onClick={onClose} />
      <aside className="side-panel-surface" aria-label="Notifications">
        <header className="side-panel-header">
          <div>
            <h2 className="side-panel-title">{t("notif.panel.title")}</h2>
            <p className="notif-panel-subtitle">
              {unread > 0
                ? t("notif.panel.unread", { n: unread })
                : t("notif.panel.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label={t("notif.panel.close")}
          >
            <X size={16} />
          </button>
        </header>

        <div className="side-panel-body">
          {sorted.length === 0 ? (
            <div className="dashed notif-panel-empty">
              {t("notif.panel.empty")}
            </div>
          ) : (
            sorted.map((n) => (
              <NotifRow
                key={n.id}
                notif={n}
                onMarkRead={markNotificationRead}
                onClear={clearNotification}
              />
            ))
          )}

          <p className="notif-panel-retention">
            {t("notif.panel.retention", { n: retention })}
          </p>
        </div>

        <footer className="side-panel-footer">
          <button
            type="button"
            className="btn btn-utility notif-panel-action"
            onClick={markAllNotificationsRead}
            disabled={unread === 0}
          >
            {t("notif.panel.markAllRead")}
          </button>
          <button
            type="button"
            className="btn btn-utility notif-panel-action"
            onClick={clearReadNotifications}
          >
            <Trash2 size={12} /> {t("notif.panel.clearRead")}
          </button>
          <button
            type="button"
            className="btn btn-utility notif-panel-action"
            onClick={clearAllNotifications}
            disabled={sorted.length === 0}
          >
            {t("notif.panel.clearAll")}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function NotifRow({
  notif,
  onMarkRead,
  onClear,
}: {
  notif: NotificationItem;
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const Icon = ICON_BY_TYPE[notif.type];
  return (
    <div
      className="notif-item"
      data-read={notif.read}
      onClick={() => !notif.read && onMarkRead(notif.id)}
      role="button"
    >
      <div className={`notif-item-icon ${notif.type}`}>
        <Icon size={14} />
      </div>
      <div className="notif-item-content">
        <p className="notif-item-title">{notif.title}</p>
        <p className="notif-item-message">{notif.message}</p>
        <p className="notif-item-time">{formatRelativeTime(notif.timestamp, locale)}</p>
      </div>
      <button
        type="button"
        className="notif-item-close"
        onClick={(e) => {
          e.stopPropagation();
          onClear(notif.id);
        }}
        aria-label={t("common.delete")}
      >
        <X size={12} />
      </button>
    </div>
  );
}
