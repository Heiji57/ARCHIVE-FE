import type { AppRoute } from "@/app/model/types";
import type { AuthRoute } from "@/app/router/authRoute";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingCTA, LandingFooter } from "./LandingFooter";

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
  /** 이메일을 받아서 /signup?email=xxx 로 이동 */
  const goSignup = (_route: AuthRoute, params?: { email?: string }) => {
    const q = params?.email
      ? `?email=${encodeURIComponent(params.email)}`
      : "";
    window.history.pushState({}, "", `/signup${q}`);
    onNavigateAuth("signup");
  };

  /** 데모 진입 — 현재 hash 로 탭 결정 */
  const goDemo = () => {
    const route = hashToRoute(window.location.hash);
    window.history.pushState({}, "", `/?demo=true`);
    onNavigateApp(route);
  };

  return (
    <div className="lp-root">
      <LandingNav
        onNavigateAuth={onNavigateAuth}
        onNavigateApp={onNavigateApp}
      />
      <LandingHero
        onNavigateAuth={goSignup}
        onDemo={goDemo}
      />
      <LandingFeatures
        onDemoTodos={() => { window.history.pushState({}, "", "/?demo=true"); onNavigateApp("todos"); }}
        onDemoRetro={() => { window.history.pushState({}, "", "/?demo=true"); onNavigateApp("retrospectives"); }}
        onDemoSettings={() => { window.history.pushState({}, "", "/?demo=true"); onNavigateApp("settings"); }}
      />
      <LandingCTA
        onNavigateAuth={goSignup}
        onDemo={goDemo}
      />
      <LandingFooter />
    </div>
  );
}
