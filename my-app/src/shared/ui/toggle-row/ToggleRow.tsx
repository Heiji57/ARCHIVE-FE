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
    <div className="toggle-row">
      <span className="toggle-row-label">{label}</span>
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
