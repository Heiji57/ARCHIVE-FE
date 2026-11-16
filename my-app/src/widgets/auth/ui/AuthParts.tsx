import { useId, type ReactNode } from "react";
import { useTranslation } from "@/shared/lib/i18n";

/**
 * 로그인, 가입 화면이 같이 쓰는 작은 조각(시안 d-auth.html).
 * 로고 표식은 39번(둥근 날개). Task 1 의 AppLogo 가 합쳐지면 그것으로 바꾼다.
 */
const WING_LEFT =
  "M6.7 11.2C7.6 13 9.2 14.6 10.6 15.2 9.8 18.4 8.2 21 6.2 22.6 4 22.8 2 22.6 1 21.8 2.6 18 4.6 14.4 6.7 11.2Z";

export function AuthBrand() {
  const { t } = useTranslation();
  const gid = `auth-lg39-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div className="auth-brand">
      <svg className="auth-brand-mark" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="7" y1="11" x2="2" y2="22">
            <stop className="auth-brand-g1" />
            <stop className="auth-brand-g2" offset="1" />
          </linearGradient>
        </defs>
        <path
          className="auth-brand-k"
          d="M12 1.8C15 5 16.8 7.6 16.2 9.3 15.4 11.4 13.6 12.4 12 13 10.4 12.4 8.6 11.4 7.8 9.3 7.2 7.6 9 5 12 1.8Z"
        />
        <path d={WING_LEFT} fill={`url(#${gid})`} />
        <path className="auth-brand-k" d={WING_LEFT} transform="matrix(-1 0 0 1 24 0)" />
        <ellipse className="auth-brand-c" cx="12" cy="19" rx="1.9" ry="2.7" />
      </svg>
      <span className="auth-brand-word">{t("nav.brand")}</span>
    </div>
  );
}

export function AuthHeading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <>
      <h1 className="auth-title">{title}</h1>
      {lead ? <p className="auth-lead">{lead}</p> : null}
    </>
  );
}

/** 폼 단위 오류(서버 응답 코드 → i18n 문구). */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <p className="auth-alert" role="alert">
      {children}
    </p>
  );
}

/** 시안의 켜기/끄기 스위치. 글자를 눌러도 바뀐다(label 안의 button). */
export function AuthSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="auth-sw">
      <button
        type="button"
        role="switch"
        className="auth-sw-b"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/** 가입 3단계 표시. 지난 단계와 지금 단계에 밑줄 색. */
export function AuthSteps({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useTranslation();
  const labels = [t("auth.signup.step1"), t("auth.signup.step2"), t("auth.signup.step3")];
  return (
    <div className="auth-steps" role="group" aria-label={t("auth.steps.label", { n: current })}>
      {labels.map((label, i) => (
        <span key={label} className={i < current ? "on" : undefined} aria-current={i + 1 === current ? "step" : undefined}>
          {label}
        </span>
      ))}
    </div>
  );
}
