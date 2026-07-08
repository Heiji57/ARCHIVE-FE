import { useEffect, useState } from "react";
import { AlertTriangle, Check, Sparkles, X } from "lucide-react";
import type { NotificationItem } from "@/entities/notification/model/types";

interface ToastViewportProps {
  notifications: NotificationItem[];
  /** Called when toast is dismissed — keeps notification in store. */
  onDismiss?: (id: string) => void;
}

const TOAST_LIFETIME_MS = 4600;

/**
 * Shows recently-added unread notifications as toasts.
 * Toasts disappear after a timeout but the underlying notification stays in
 * the store so the user can review it from the NotificationPanel.
 */
export function ToastViewport({
  notifications,
  onDismiss,
}: ToastViewportProps) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // Schedule auto-hide for each visible notification.
  useEffect(() => {
    const timers: number[] = [];
    for (const n of notifications) {
      if (hiddenIds.has(n.id)) continue;
      // Only auto-hide notifications created in the last 30s (so existing
      // ones from history don't flood the screen on mount).
      const age = Date.now() - new Date(n.timestamp).getTime();
      if (age >= TOAST_LIFETIME_MS) {
        // Stale — hide immediately on mount (시간 기반 동기화라 예외 처리).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHiddenIds((prev) => {
          if (prev.has(n.id)) return prev;
          const next = new Set(prev);
          next.add(n.id);
          return next;
        });
        continue;
      }
      const remaining = TOAST_LIFETIME_MS - age;
      const id = window.setTimeout(() => {
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.add(n.id);
          return next;
        });
      }, remaining);
      timers.push(id);
    }
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [notifications, hiddenIds]);

  const visible = notifications.filter((n) => !hiddenIds.has(n.id));
  if (visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    onDismiss?.(id);
  };

  return (
    <div className="toast-stack" aria-live="polite">
      {visible.slice(0, 3).map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
          role="status"
        >
          <div className="toast-icon">
            {notification.type === "success" ? (
              <Check size={16} strokeWidth={2.4} />
            ) : notification.type === "warning" ? (
              <AlertTriangle size={16} />
            ) : (
              <Sparkles size={16} />
            )}
          </div>
          <div className="toast-body">
            <p className="toast-title">{notification.title}</p>
            {notification.message ? (
              <p className="toast-msg">{notification.message}</p>
            ) : null}
            {notification.actionLabel && notification.actionHref ? (
              <a className="toast-action" href={notification.actionHref}>
                {notification.actionLabel} →
              </a>
            ) : null}
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => handleDismiss(notification.id)}
            aria-label="알림 닫기"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
