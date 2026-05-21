/**
 * Reusable label + iOS-style toggle row.
 * Used in Settings (Auto-Summary toggles) and anywhere a horizontal
 * "label on the left / switch on the right" pattern is needed.
 */
export interface ToggleRowProps {
  label: string;
  on: boolean;
  onChange: (next: boolean) => void;
}

export function ToggleRow({ label, on, onChange }: ToggleRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        background: "var(--color-tile-3)",
        borderRadius: "var(--r-md)",
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className="ios-toggle"
        data-on={on}
      />
    </div>
  );
}
