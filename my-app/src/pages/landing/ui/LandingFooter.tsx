import { type FormEvent, useState } from "react"
import type { AppRoute } from "@/app/model/types"
import type { AuthRoute } from "@/app/router/authRoute"
import { CabinetMark } from "./CabinetMark"
import { revealDelay } from "./useScrollReveal"

interface LandingCTAProps {
  onNavigateAuth: (route: AuthRoute, params?: { email?: string }) => void
  onDemo: () => void
}

export function LandingCTA({ onNavigateAuth, onDemo }: LandingCTAProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onNavigateAuth("signup", { email: email.trim() })
  }

  return (
    <section className="lp-section" id="pricing" style={{ paddingTop: 0 }}>
      <div className="lp-final">
        <div className="lp-hero-stars" aria-hidden="true" />
        <div className="lp-final-inner">
          <h2 className="lp-reveal" style={revealDelay(0)}>
            오늘부터, 당신의 하루를 기록하세요
          </h2>
          <p className="lp-reveal" style={revealDelay(100)}>
            1인 개발자에게 언제까지나 무료입니다. 첫 회고를 30초 만에.
          </p>
          <div className="lp-capture lp-reveal" style={revealDelay(200)}>
            <form className="lp-email-group" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                aria-label="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">
                무료로 시작 →
              </button>
            </form>
            <button type="button" className="lp-try" onClick={onDemo}>
              데모 둘러보기
            </button>
          </div>
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

/** 모든 링크는 실제 이동 가능한 대상만 보유 (미구현 항목 제거) */
const FOOTER_COLS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "제품",
    links: [
      { label: "캘린더", action: { kind: "demo", route: "calendar" } },
      { label: "할 일", action: { kind: "demo", route: "todos" } },
      { label: "회고", action: { kind: "demo", route: "retrospectives" } },
      { label: "설정", action: { kind: "demo", route: "settings" } },
    ],
  },
  {
    title: "둘러보기",
    links: [
      {
        label: "제품 미리보기",
        action: { kind: "scroll", target: "features" },
      },
      { label: "워크플로우", action: { kind: "scroll", target: "workflow" } },
      { label: "AI 자동 회고", action: { kind: "scroll", target: "ai" } },
      { label: "GitHub 연동", action: { kind: "scroll", target: "sync" } },
    ],
  },
  {
    title: "시작하기",
    links: [
      { label: "무료로 시작", action: { kind: "auth", route: "signup" } },
      { label: "로그인", action: { kind: "auth", route: "login" } },
      { label: "데모 둘러보기", action: { kind: "demo", route: "calendar" } },
      { label: "요금제", action: { kind: "scroll", target: "pricing" } },
    ],
  },
]

interface LandingFooterProps {
  onNavigateAuth: (route: AuthRoute) => void
  onDemo: (route: AppRoute) => void
}

export function LandingFooter({ onNavigateAuth, onDemo }: LandingFooterProps) {
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
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-grid">
          <div className="lp-reveal" style={revealDelay(0)}>
            <span className="lp-brand">
              <CabinetMark className="lp-brand-mark" />
              <span className="lp-brand-name" style={{ fontSize: 15 }}>
                A.R.C.H.I.V.E
              </span>
            </span>
            <p className="lp-footer-tagline">
              매일의 작업과 회고를 GitHub와 한 흐름으로 묶어내는, 개발자를 위한
              다크모드 아카이브.
            </p>
            <a
              className="pill pill-ghost lp-footer-gh"
              href="https://github.com/Heiji57"
              target="_blank"
              rel="noreferrer noopener">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.21.67.79.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z" />
              </svg>
              @Heiji57 · v1.0
            </a>
          </div>

          {FOOTER_COLS.map((col, i) => (
            <div
              key={col.title}
              className="lp-reveal"
              style={revealDelay(100 + i * 90)}>
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
      </div>

      <div className="lp-footer-bottom">
        <span>
          © 2026 A.R.C.H.I.V.E Studio. 모든 회고는 사용자의 GitHub 계정에
          안전하게 보관됩니다.
        </span>
        <span>Built on dark · Built for one developer at a time.</span>
      </div>
    </footer>
  )
}
