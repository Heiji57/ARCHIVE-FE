/**
 * Empty/placeholder state using the `.dashed` style.
 * Used in retrospective list, todo column, etc.
 */
export interface EmptyStateProps {
  message: string;
  minHeight?: number | string;
  fontSize?: number;
  style?: React.CSSProperties;
}

export function EmptyState({
  message,
  minHeight = 80,
  fontSize = 12,
  style,
}: EmptyStateProps) {
  return (
    <div
      className="dashed"
      style={{
        minHeight,
        fontSize,
        color: "var(--color-ink-muted-48)",
        ...style,
      }}
    >
      {message}
    </div>
  );
}
