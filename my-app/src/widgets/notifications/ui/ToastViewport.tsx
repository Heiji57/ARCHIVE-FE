import type { NotificationItem } from "@/entities/notification/model/types";
import { AlertTriangle, Check, Sparkles, X } from "lucide-react";

interface ToastViewportProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({
  notifications,
  onDismiss,
}: ToastViewportProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite">
      {notifications.map((notification) => (
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
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(notification.id)}
            aria-label="알림 닫기"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
