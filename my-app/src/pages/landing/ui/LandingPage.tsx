import { useEffect, useRef } from "react"
import type { AppRoute } from "@/app/model/types"
import type { AuthRoute } from "@/app/router/authRoute"
import { useTranslation } from "@/shared/lib/i18n"
import { LandingNav, LandingRail } from "./LandingNav"
import { LandingHero } from "./LandingHero"
import { LandingFlow } from "./LandingFlow"
import { LandingFeatures } from "./LandingFeatures"
import { LandingCTA, LandingFooter } from "./LandingFooter"
import { useLandingMotion } from "./useLandingMotion"

/** demo 모드용 hash → AppRoute 매핑 */
function hashToRoute(hash: string): AppRoute {
  switch (hash) {
    case "#todos":
      return "todos"
    case "#retrospectives":
      return "retrospectives"
    case "#settings":
      return "settings"
    default:
      return "calendar"
  }
}

interface LandingPageProps {
  onNavigateAuth: (route: AuthRoute) => void
  onNavigateApp: (route: AppRoute) => void
}

export function LandingPage({
  onNavigateAuth,
  onNavigateApp,
}: LandingPageProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const summaryText = [
    t("landing.mock.weeklyFlowHeading"),
    t("landing.mock.weeklyFlowBodyShort"),
    t("landing.mock.showcaseAiMeta"),
    t("landing.mock.nextActionLabeled"),
  ].join("\n")
  useLandingMotion(rootRef, summaryText)

  /** 화면 스크롤 스냅은 랜딩 마운트 동안만 <html> 에 스코프한다 */
  useEffect(() => {
    document.documentElement.classList.add("lp-snap")
    return () => document.documentElement.classList.remove("lp-snap")
  }, [])

  /** 이메일을 받아서 /signup?email=xxx 로 이동 */
  const goSignup = (_route: AuthRoute, params?: { email?: string }) => {
    const q = params?.email ? `?email=${encodeURIComponent(params.email)}` : ""
    window.history.pushState({}, "", `/signup${q}`)
    onNavigateAuth("signup")
  }

  /** 데모 진입 — 특정 앱 탭으로 */
  const goDemoRoute = (route: AppRoute) => {
    window.history.pushState({}, "", `/?demo=true`)
    onNavigateApp(route)
  }

  /** 데모 진입 — 현재 hash 로 탭 결정 */
  const goDemo = () => goDemoRoute(hashToRoute(window.location.hash))

  /** 히어로 CTA — 이메일 캡처(CTA) 섹션으로 스크롤 */
  const scrollToCta = () =>
    document
      .getElementById("cta")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="lp-root" ref={rootRef}>
      <LandingRail />
      <LandingNav onNavigateAuth={onNavigateAuth} />
      <LandingHero onPrimary={scrollToCta} />
      <LandingFlow />
      <LandingFeatures />
      <LandingCTA onNavigateAuth={goSignup} onDemo={goDemo} />
      <LandingFooter onNavigateAuth={onNavigateAuth} onDemo={goDemoRoute} />
    </div>
  )
}
