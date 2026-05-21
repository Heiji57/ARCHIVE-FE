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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 22,
      }}
    >
      <div className={`avatar avatar-md avatar-${iconVariant}`}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p
          className="t-eyebrow"
          style={{ margin: "0 0 4px", color: "var(--color-body-muted)" }}
        >
          {eyebrow}
        </p>
        <h3
          style={{
            margin: 0,
            fontSize: 22,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h3>
      </div>
      {trailing ?? null}
    </div>
  );
}
