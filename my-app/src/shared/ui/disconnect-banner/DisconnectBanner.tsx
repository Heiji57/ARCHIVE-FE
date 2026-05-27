import { Lock } from "lucide-react";

/**
 * Warning banner shown when GitHub (or any external integration)
 * is not connected. Renders the existing `.disconnect-banner` CSS class.
 */
export interface DisconnectBannerProps {
  message: string;
  style?: React.CSSProperties;
}

export function DisconnectBanner({ message, style }: DisconnectBannerProps) {
  return (
    <div className="disconnect-banner" style={style}>
      <Lock size={14} />
      <span>{message}</span>
    </div>
  );
}
