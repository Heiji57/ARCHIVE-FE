import type { CSSProperties, ReactNode } from "react";

export type PillTone = "blue" | "green" | "warn" | "ghost" | "outline";

const TONE_CLASS: Record<PillTone, string> = {
  blue: "pill-blue",
  green: "pill-green",
  warn: "pill-warn",
  ghost: "pill-ghost",
  outline: "pill-outline",
};

interface PillProps {
  tone: PillTone;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  as?: "span" | "button";
  onClick?: () => void;
  title?: string;
}

/**
 * Claude Design pill chip. Tone selects color treatment.
 *
 * `as="button"` 를 지정하면 클릭 가능한 chip이 됩니다.
 */
export function Pill({
  tone,
  children,
  style,
  className,
  as = "span",
  onClick,
  title,
}: PillProps) {
  const cls = `pill ${TONE_CLASS[tone]}${className ? ` ${className}` : ""}`;

  if (as === "button") {
    return (
      <button
        type="button"
        className={cls}
        style={style}
        onClick={onClick}
        title={title}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={cls} style={style} title={title}>
      {children}
    </span>
  );
}
