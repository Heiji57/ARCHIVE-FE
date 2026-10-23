import { Link2 } from "lucide-react";

/**
 * 연결은 되어 있지만 다시 인증이 필요한 상태를 알리는 한 줄 패널.
 * 중립 배경 + 노란 점 하나로 상태를 표시하고, 오른쪽에 재연결 버튼을 둔다.
 */
export interface ReconnectPanelProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}

export function ReconnectPanel({ title, message, actionLabel, onAction, disabled }: ReconnectPanelProps) {
  return (
    <div className="reconnect-panel" role="status">
      <div className="reconnect-panel-text">
        <span className="reconnect-panel-title">
          <span className="reconnect-panel-dot" aria-hidden="true" />
          {title}
        </span>
        <p className="reconnect-panel-msg">{message}</p>
      </div>
      <button
        type="button"
        className="btn btn-utility settings-action-btn"
        onClick={onAction}
        disabled={disabled}
      >
        <Link2 size={13} /> {actionLabel}
      </button>
    </div>
  );
}
