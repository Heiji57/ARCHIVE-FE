import type { AuthRoute } from "@/app/router/authRoute"
import type { Locale } from "@/app/model/settings"
import { useArchiveApp } from "@/app/providers/useArchiveApp"
import { ArchiveLogo } from "@/shared/ui"
import { useTranslation } from "@/shared/lib/i18n"

interface LandingNavProps {
  onNavigateAuth: (route: AuthRoute) => void
}

/** 랜딩 페이지는 4개 언어 중 영어/한국어만 노출한다 */
const LANDING_LOCALES: Array<{ code: Locale; native: string }> = [
  { code: "en", native: "English" },
  { code: "ko", native: "한국어" },
]

/** 상단 언어 토글 — 전역 settings.locale 을 그대로 읽고 쓴다 (로그인 후에도 유지) */
function LandingLangToggle() {
  const { state, setLocale } = useArchiveApp()

  return (
    <div className="lp-lang-toggle" role="group" aria-label="Language">
      {LANDING_LOCALES.map((opt) => (
        <button
          key={opt.code}
          type="button"
          className="lp-lang-btn"
          data-active={state.settings.locale === opt.code ? "1" : "0"}
          onClick={() => setLocale(opt.code)}>
          {opt.native}
        </button>
      ))}
    </div>
  )
}

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

/** 좌측 고정 진행 rail — useLandingMotion 이 data-rail-* 를 제어한다. */
export function LandingRail() {
  return (
    <div className="lp-rail" aria-hidden="true">
      <div className="lp-rail-track">
        <div className="lp-rail-fill" data-rail-fill />
        <span className="lp-rail-dot" data-rail-dot />
      </div>
      <span className="lp-rail-label">A day, archived</span>
      <span className="lp-rail-pct" data-rail-pct>
        00
      </span>
    </div>
  )
}

export function LandingNav({ onNavigateAuth }: LandingNavProps) {
  const { t } = useTranslation()

  return (
    <nav className="lp-nav" aria-label="Primary">
      <div className="lp-nav-inner">
        <button type="button" className="lp-brand" onClick={scrollToTop}>
          <ArchiveLogo className="lp-brand-mark" />
          <span className="lp-brand-name">A.R.C.H.I.V.E</span>
        </button>

        <div className="lp-nav-actions">
          <LandingLangToggle />
          <button
            type="button"
            className="lp-btn lp-btn-ghost"
            onClick={() => onNavigateAuth("login")}>
            {t("landing.nav.login")}
          </button>
          <button
            type="button"
            className="lp-btn lp-btn-primary"
            onClick={() => onNavigateAuth("signup")}>
            {t("landing.nav.start")}
          </button>
        </div>
      </div>
    </nav>
  )
}

export { scrollToId }
