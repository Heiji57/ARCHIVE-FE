import { useRef } from "react";
import type { AppRoute } from "@/app/model/types";
import type { AuthRoute } from "@/app/router/authRoute";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingCTA, LandingFooter } from "./LandingFooter";
import { useScrollReveal } from "./useScrollReveal";

/** demo 모드용 hash → AppRoute 매핑 */
function hashToRoute(hash: string): AppRoute {
  switch (hash) {
    case "#todos":          return "todos";
    case "#retrospectives": return "retrospectives";
    case "#settings":       return "settings";
    default:                return "calendar";
  }
}

interface LandingPageProps {
  onNavigateAuth: (route: AuthRoute) => void;
  onNavigateApp: (route: AppRoute) => void;
}

export function LandingPage({ onNavigateAuth, onNavigateApp }: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollReveal(rootRef);

  /** 이메일을 받아서 /signup?email=xxx 로 이동 */
  const goSignup = (_route: AuthRoute, params?: { email?: string }) => {
    const q = params?.email
      ? `?email=${encodeURIComponent(params.email)}`
      : "";
    window.history.pushState({}, "", `/signup${q}`);
    onNavigateAuth("signup");
  };

  /** 데모 진입 — 특정 앱 탭으로 */
  const goDemoRoute = (route: AppRoute) => {
    window.history.pushState({}, "", `/?demo=true`);
    onNavigateApp(route);
  };

  /** 데모 진입 — 현재 hash 로 탭 결정 */
  const goDemo = () => goDemoRoute(hashToRoute(window.location.hash));

  return (
    <div className="lp-root" ref={rootRef}>
      <LandingNav onNavigateAuth={onNavigateAuth} />
      <LandingHero
        onNavigateAuth={goSignup}
        onDemo={goDemo}
      />
      <LandingFeatures
        onDemoTodos={() => goDemoRoute("todos")}
        onDemoRetro={() => goDemoRoute("retrospectives")}
        onDemoSettings={() => goDemoRoute("settings")}
      />
      <LandingCTA
        onNavigateAuth={goSignup}
        onDemo={goDemo}
      />
      <LandingFooter
        onNavigateAuth={onNavigateAuth}
        onDemo={goDemoRoute}
      />
    </div>
  );
}
