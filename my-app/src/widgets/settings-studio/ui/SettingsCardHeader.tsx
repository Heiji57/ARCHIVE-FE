import type { ReactNode } from "react";

/**
 * Shared header pattern across every Settings card:
 *   [avatar icon]  EYEBROW
 *                  TITLE
 *                                [trailing slot]
 */
export interface SettingsCardHeaderProps {
  icon: ReactNode;
  iconVariant?: "ink" | "primary";
  eyebrow: string;
  title: string;
  trailing?: ReactNode;
}

export function SettingsCardHeader({
  icon,
  iconVariant = "ink",
  eyebrow,
  title,
  trailing,
}: SettingsCardHeaderProps) {
  return (
    <div className="settings-card-header">
      <div className={`avatar avatar-md avatar-${iconVariant}`}>{icon}</div>
      <div className="settings-card-header-body">
        <p className="t-eyebrow settings-card-header-eyebrow">{eyebrow}</p>
        <h3 className="settings-card-header-title">{title}</h3>
      </div>
      {trailing ?? null}
    </div>
  );
}
