import type { ReactNode } from "react";

/**
 * Shared header pattern across every Settings card:
 *   [avatar icon]  EYEBROW
 *                  TITLE
 *                                [trailing slot]
 *
 * `mark` 를 넘기면 둥근 아바타 대신 그 요소(연동 카드의 서비스 마크 타일)를 쓴다.
 */
export interface SettingsCardHeaderProps {
  icon?: ReactNode;
  iconVariant?: "ink" | "primary";
  mark?: ReactNode;
  eyebrow: string;
  title: string;
  trailing?: ReactNode;
}

export function SettingsCardHeader({
  icon,
  iconVariant = "ink",
  mark,
  eyebrow,
  title,
  trailing,
}: SettingsCardHeaderProps) {
  return (
    <div className="settings-card-header">
      {mark ?? <div className={`avatar avatar-md avatar-${iconVariant}`}>{icon}</div>}
      <div className="settings-card-header-body">
        <p className="t-eyebrow settings-card-header-eyebrow">{eyebrow}</p>
        <h3 className="settings-card-header-title">{title}</h3>
      </div>
      {trailing ?? null}
    </div>
  );
}
