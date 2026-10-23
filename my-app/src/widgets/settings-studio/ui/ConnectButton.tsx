import { ArrowUpRight } from "lucide-react";
import { GithubGlyph, type Service } from "./ServiceMark";

/**
 * 미연결 상태의 연결 버튼. 서비스 마크 + 라벨 + ↗(새 창에서 OAuth 팝업이 열림)
 * 옆에 같은 내용을 짧은 안내문으로 덧붙인다.
 */
export interface ConnectButtonProps {
  service: Service;
  label: string;
  note: string;
  onClick: () => void;
  disabled?: boolean;
}

export function ConnectButton({ service, label, note, onClick, disabled }: ConnectButtonProps) {
  return (
    <div className="connect-cta">
      <button type="button" className="btn-connect" onClick={onClick} disabled={disabled}>
        {service === "github" ? (
          <GithubGlyph size={16} />
        ) : (
          <span className="btn-connect-cal" aria-hidden="true" />
        )}
        {label}
        <ArrowUpRight size={13} className="btn-connect-ext" aria-hidden="true" />
      </button>
      <span className="connect-cta-note">{note}</span>
    </div>
  );
}
