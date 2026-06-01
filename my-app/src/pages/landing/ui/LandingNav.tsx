import type { AuthRoute } from "@/app/router/authRoute";
import type { AppRoute } from "@/app/model/types";

interface LandingNavProps {
  onNavigateAuth: (route: AuthRoute) => void;
  onNavigateApp?: (route: AppRoute) => void;
}

export function LandingNav({ onNavigateAuth }: LandingNavProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <button
          type="button"
          className="lp-nav-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <svg viewBox="0 0 36 32" className="lp-brand-mark" aria-hidden="true">
            <path d="M 22 4 L 33 9 L 33 19 L 22 14 Z" fill="#f5f5f7" opacity="0.5" />
            <path d="M 16 9 L 27 14 L 27 23 L 16 18 Z" fill="#f5f5f7" opacity="0.72" />
            <path d="M 10 14 L 21 19 L 21 28 L 10 23 Z" fill="#0a84ff" />
            <path d="M 21 19 L 23 20 L 23 29 L 21 28 Z" fill="#0a84ff" opacity="0.62" />
            <path d="M 4 21 L 15 26 L 15 31 L 4 26 Z" fill="#f5f5f7" opacity="0.32" />
            <path d="M 15 26 L 23 23 L 23 28 L 15 31 Z" fill="#f5f5f7" opacity="0.2" />
          </svg>
          A.R.C.H.I.V.E
        </button>

        <div className="lp-nav-links">
          <button type="button" className="lp-nav-link" onClick={() => scrollTo("features")}>
            제품
          </button>
          <button type="button" className="lp-nav-link" onClick={() => scrollTo("workflow")}>
            워크플로우
          </button>
          <button type="button" className="lp-nav-link" onClick={() => scrollTo("ai")}>
            AI 회고
          </button>
          <button type="button" className="lp-nav-link" onClick={() => scrollTo("pricing")}>
            요금제
          </button>
        </div>

        <div className="lp-nav-actions">
          <button
            type="button"
            className="lp-nav-login"
            onClick={() => onNavigateAuth("login")}
          >
            로그인
          </button>
          <button
            type="button"
            className="btn btn-primary lp-nav-cta"
            onClick={() => onNavigateAuth("signup")}
          >
            시작하기
          </button>
        </div>
      </div>
    </nav>
  );
}
