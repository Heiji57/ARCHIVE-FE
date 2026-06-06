import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

/**
 * 비밀번호 입력 + 표시/숨기기 토글.
 * TextField 와 동일한 CSS 구조를 사용하며, trailing 버튼 영역에 Eye 아이콘을 배치한다.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { label, hint, error, fullWidth = true, id, ...rest },
    ref,
  ) {
    const { t } = useTranslation();
    const [show, setShow] = useState(false);
    const reactId = useId();
    const fieldId = id ?? `pw-field-${reactId}`;
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
          <input
            ref={ref}
            id={fieldId}
            type={show ? "text" : "password"}
            className="text-field-input"
            aria-invalid={Boolean(error)}
            aria-describedby={describedById}
            {...rest}
          />
          <button
            type="button"
            className="text-field-eye-btn"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? t("auth.password.hide") : t("auth.password.show")}
            aria-pressed={show}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
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
