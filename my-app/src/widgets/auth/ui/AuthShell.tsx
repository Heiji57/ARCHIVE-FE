import type { ReactNode } from "react";
import { AuthBrand, AuthHeading } from "./AuthParts";
import { LocaleToggle } from "./LocaleToggle";

interface AuthShellProps {
  /** 정해진 제목이 있는 화면만. 단계마다 제목이 바뀌는 폼은 AuthHeading 을 직접 그린다. */
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** 로그인, 가입, 재설정, 온보딩의 바깥 틀(시안 d-auth.html): 오른쪽 위 언어, 가운데 360px 한 줄. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-page">
      <LocaleToggle className="auth-lang" buttonClassName="auth-lang-btn" />
      <main className="auth-col">
        <AuthBrand />
        {title ? <AuthHeading title={title} lead={subtitle} /> : null}
        {children}
        {footer ? <div className="auth-foot">{footer}</div> : null}
      </main>
    </div>
  );
}
