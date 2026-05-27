import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, hint, error, leadingIcon, trailingIcon, fullWidth = true, id, ...rest },
    ref,
  ) {
    const reactId = useId();
    const fieldId = id ?? `text-field-${reactId}`;
    const describedById = hint || error ? `${fieldId}-desc` : undefined;

    return (
      <div
        className={[
          "text-field",
          error ? "is-invalid" : "",
          fullWidth ? "" : "text-field-auto",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label ? (
          <label htmlFor={fieldId} className="text-field-label">
            {label}
          </label>
        ) : null}
        <div className="text-field-control">
          {leadingIcon ? (
            <span className="text-field-leading" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={fieldId}
            className="text-field-input"
            aria-invalid={Boolean(error)}
            aria-describedby={describedById}
            {...rest}
          />
          {trailingIcon ? (
            <span className="text-field-trailing" aria-hidden="true">
              {trailingIcon}
            </span>
          ) : null}
        </div>
        {error ? (
          <p id={describedById} className="text-field-error" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={describedById} className="text-field-hint">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
