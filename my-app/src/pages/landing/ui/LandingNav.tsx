import type { AuthRoute } from "@/app/router/authRoute"
import { CabinetMark } from "./CabinetMark"

interface LandingNavProps {
  onNavigateAuth: (route: AuthRoute) => void
}

const NAV_LINKS: Array<{ id: string; label: string }> = [
  { id: "features", label: "제품" },
  { id: "workflow", label: "워크플로우" },
  { id: "sync", label: "GitHub 연동" },
  { id: "ai", label: "AI 회고" },
  { id: "looking", label: "둘러보기" },
]

export function LandingNav({ onNavigateAuth }: LandingNavProps) {
  // `.lp-root`가 스크롤 컨테이너이므로 scrollIntoView 사용
  // (scroll-padding-top: 64px 가 nav 높이만큼 자동 보정)
  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const scrollToTop = () => {
    document.querySelector(".lp-root")?.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <nav className="lp-nav" aria-label="Primary">
      <div className="lp-nav-inner">
        <button type="button" className="lp-brand" onClick={scrollToTop}>
          <CabinetMark className="lp-brand-mark" />
          <span className="lp-brand-name">A.R.C.H.I.V.E</span>
        </button>

        <div className="lp-nav-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className="lp-nav-link"
              onClick={() => scrollTo(link.id)}>
              {link.label}
            </button>
          ))}
        </div>

        <div className="lp-nav-right">
          <button
            type="button"
            className="lp-signin"
            onClick={() => onNavigateAuth("login")}>
            로그인
          </button>
          <button
            type="button"
            className="btn btn-primary lp-nav-cta"
            onClick={() => onNavigateAuth("signup")}>
            시작하기
          </button>
        </div>
      </div>
    </nav>
  )
}
