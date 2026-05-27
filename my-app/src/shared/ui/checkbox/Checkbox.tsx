import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: ReactNode;
}

export function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  const reactId = useId();
  const fieldId = id ?? `checkbox-${reactId}`;
  return (
    <label htmlFor={fieldId} className={`checkbox-row ${className ?? ""}`}>
      <input id={fieldId} type="checkbox" className="checkbox-input" {...rest} />
      <span className="checkbox-label">{label}</span>
    </label>
  );
}
