import { type FormEvent, useState } from "react"
import type { AppRoute } from "@/app/model/types"
import type { AuthRoute } from "@/app/router/authRoute"
import { ArchiveLogo } from "@/shared/ui"
import { useTranslation } from "@/shared/lib/i18n"
import type { TranslateFn } from "@/shared/lib/i18n"

interface LandingCTAProps {
  onNavigateAuth: (route: AuthRoute, params?: { email?: string }) => void
  onDemo: () => void
}

export function LandingCTA({ onNavigateAuth, onDemo }: LandingCTAProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onNavigateAuth("signup", { email: email.trim() })
  }

  return (
    <section id="cta" className="lp-cta lp-snap-screen">
      <div className="lp-cta-grid" data-bg aria-hidden="true" />
      <div className="lp-cta-inner">
        <h2 className="lp-reveal" data-reveal="0">
          {t("landing.cta.title")}
        </h2>
        <p className="lp-reveal" data-reveal="1">
          {t("landing.cta.subtitle")}
        </p>
        <div className="lp-cta-actions lp-reveal" data-reveal="2">
          <form className="lp-email-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder={t("landing.cta.emailPlaceholder")}
              aria-label={t("landing.cta.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">{t("landing.hero.cta")}</button>
          </form>
          <button type="button" className="lp-demo-btn" onClick={onDemo}>
            {t("landing.cta.demo")}
          </button>
        </div>
      </div>
    </section>
  )
}

/** 푸터 링크 동작: 페이지 내 섹션 스크롤 / 데모 앱 탭 / 인증 페이지 */
type FooterAction =
  | { kind: "scroll"; target: string }
  | { kind: "demo"; route: AppRoute }
  | { kind: "auth"; route: AuthRoute }

interface FooterLink {
  label: string
  action: FooterAction
}

function getFooterCols(t: TranslateFn): Array<{ title: string; links: FooterLink[] }> {
  return [
    {
      title: t("landing.footer.col.product.title"),
      links: [
        { label: t("nav.calendar"), action: { kind: "demo", route: "calendar" } },
        { label: t("nav.todos"), action: { kind: "demo", route: "todos" } },
        { label: t("nav.retrospectives"), action: { kind: "demo", route: "retrospectives" } },
        {
          label: t("landing.showcase.tab.ai.title"),
          action: { kind: "scroll", target: "flow" },
        },
      ],
    },
    {
      title: t("landing.footer.col.explore.title"),
      links: [
        { label: t("landing.footer.link.dayFlow"), action: { kind: "scroll", target: "flow" } },
        { label: t("landing.footer.link.why"), action: { kind: "scroll", target: "numbers" } },
        {
          label: t("landing.footer.link.githubIntegration"),
          action: { kind: "scroll", target: "flow" },
        },
      ],
    },
    {
      title: t("landing.footer.col.start.title"),
      links: [
        { label: t("landing.footer.link.startFree"), action: { kind: "auth", route: "signup" } },
        { label: t("landing.nav.login"), action: { kind: "auth", route: "login" } },
        { label: t("landing.cta.demo"), action: { kind: "demo", route: "calendar" } },
      ],
    },
  ]
}

interface LandingFooterProps {
  onNavigateAuth: (route: AuthRoute) => void
  onDemo: (route: AppRoute) => void
}

export function LandingFooter({ onNavigateAuth, onDemo }: LandingFooterProps) {
  const { t } = useTranslation()
  const footerCols = getFooterCols(t)

  const runAction = (action: FooterAction) => {
    switch (action.kind) {
      case "scroll":
        document
          .getElementById(action.target)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      case "demo":
        onDemo(action.route)
        return
      case "auth":
        onNavigateAuth(action.route)
        return
    }
  }

  return (
    <footer className="lp-footer lp-snap-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-grid">
          <div className="lp-footer-brandcol">
            <span className="lp-brand" style={{ cursor: "default" }}>
              <ArchiveLogo className="lp-brand-mark" />
              <span className="lp-brand-name" style={{ fontSize: 16 }}>
                A.R.C.H.I.V.E
              </span>
            </span>
            <p className="lp-footer-tagline">{t("landing.footer.tagline")}</p>
            <a
              className="lp-footer-gh"
              href="https://github.com/Heiji57"
              target="_blank"
              rel="noreferrer noopener">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.21.67.79.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z" />
              </svg>
              @Heiji57 · v1.0
            </a>
          </div>

          {footerCols.map((col) => (
            <div key={col.title} className="lp-footer-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      className="lp-footer-link"
                      onClick={() => runAction(link.action)}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lp-footer-bottom">
          <span>{t("landing.footer.copyright")}</span>
          <span>Built on dark · Built for one developer at a time.</span>
        </div>
      </div>
    </footer>
  )
}
