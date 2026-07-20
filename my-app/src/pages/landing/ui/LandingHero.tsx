import type { CSSProperties } from "react"
import { useTranslation } from "@/shared/lib/i18n"

interface LandingHeroProps {
  /** 히어로 CTA — CTA 섹션(이메일 캡처)으로 스크롤 */
  onPrimary: () => void
}

/** CSS custom property(--fx 등)를 포함할 수 있는 스타일 타입 */
type StyleVars = CSSProperties & Record<`--${string}`, string>

const DROP = "lp-card-drop 0.8s cubic-bezier(0.22,0.61,0.36,1)"

export function LandingHero({ onPrimary }: LandingHeroProps) {
  const { t } = useTranslation()

  return (
    <header id="top" className="lp-hero">
      <div className="lp-hero-grid" data-hero-grid data-bg aria-hidden="true" />
      <div className="lp-hero-beam" data-hero-beam aria-hidden="true" />

      <div className="lp-hero-cards" data-cards aria-hidden="true">
        {/* 좌상단 — 이벤트 */}
        <div
          className="lp-fcard"
          style={
            {
              left: "max(52px, calc(50% - 588px))",
              top: "20%",
              "--fx": "-40px",
              "--fy": "-30px",
              "--fr": "-8deg",
              animation: `${DROP} 0.5s both, lp-float-a 8s ease-in-out 1.3s infinite`,
            } as StyleVars
          }>
          <p className="lp-fcard-ey" style={{ color: "#d9a23a" }}>
            EVENT · 10:00
          </p>
          <p className="lp-fcard-title">{t("landing.mock.sprintPlanning")}</p>
        </div>

        {/* 우상단 — 진행 중 */}
        <div
          className="lp-fcard"
          style={
            {
              right: "max(52px, calc(50% - 574px))",
              top: "16%",
              border: "1px solid rgba(94,106,210,0.4)",
              "--fx": "44px",
              "--fy": "-30px",
              "--fr": "8deg",
              animation: `${DROP} 0.64s both, lp-float-b 9s ease-in-out 1.5s infinite`,
            } as StyleVars
          }>
          <p className="lp-fcard-ey" style={{ color: "#828fff" }}>
            IN PROGRESS
          </p>
          <p className="lp-fcard-title">{t("landing.mock.subheaderWork")}</p>
        </div>

        {/* 좌하단 — 오늘의 기록 */}
        <div
          className="lp-fcard"
          style={
            {
              left: "max(60px, calc(50% - 560px))",
              bottom: "20%",
              padding: "12px 15px",
              "--fx": "-40px",
              "--fy": "34px",
              "--fr": "-6deg",
              animation: `${DROP} 0.78s both, lp-float-c 7.5s ease-in-out 1.2s infinite`,
            } as StyleVars
          }>
          <p
            className="lp-fcard-ey"
            style={{
              margin: 0,
              color: "#62666d",
              display: "flex",
              gap: "8px",
              fontSize: "11px",
            }}>
            <span style={{ color: "#828fff", fontWeight: 600 }}>
              {t("landing.mock.heroLogTime")}
            </span>
            {t("landing.mock.heroLogText")}
          </p>
        </div>

        {/* 우하단 — AI 요약 */}
        <div
          className="lp-fcard"
          style={
            {
              right: "max(56px, calc(50% - 588px))",
              bottom: "17%",
              maxWidth: "200px",
              "--fx": "44px",
              "--fy": "34px",
              "--fr": "7deg",
              animation: `${DROP} 0.92s both, lp-float-d 8.5s ease-in-out 1.7s infinite`,
            } as StyleVars
          }>
          <p className="lp-fcard-ey" style={{ color: "#5e6ad2" }}>
            {t("landing.mock.aiWeeklyLabel")}
          </p>
          <p
            className="lp-fcard-title"
            style={{ fontSize: "12px", color: "#a4abb5", lineHeight: 1.5 }}>
            {t("landing.mock.heroStats")}
          </p>
        </div>

        {/* 중앙 좌측 — 완료 항목 */}
        <div
          className="lp-fcard"
          style={
            {
              left: "max(44px, calc(50% - 508px))",
              top: "46%",
              borderRadius: "10px",
              padding: "10px 13px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
              "--fx": "-36px",
              "--fy": "20px",
              "--fr": "5deg",
              animation: `${DROP} 1.06s both, lp-float-b 7s ease-in-out 2s infinite`,
            } as StyleVars
          }>
          <p
            className="lp-fcard-title"
            style={{
              fontSize: "12px",
              color: "#8a8f98",
              textDecoration: "line-through",
            }}>
            {t("landing.mock.cacheStrategy")} ✓
          </p>
        </div>
      </div>

      <div className="lp-hero-body">
        <span className="lp-hero-mark" data-hero-mark />
        <h1>
          <span className="line">
            <span className="lp-hw" data-hw>
              {t("landing.hero.title.word1")}&nbsp;
            </span>
            <span className="lp-hw" data-hw>
              {t("landing.hero.title.word2")}
            </span>
          </span>
          <span className="line">
            <span className="lp-hw accent" data-hw>
              {t("landing.hero.title.word3")}&nbsp;
            </span>
            <span className="lp-hw accent" data-hw>
              {t("landing.hero.title.word4")}
            </span>
          </span>
        </h1>
        <p className="lp-hero-sub" data-hero-reveal>
          {t("landing.hero.subtitle")}
        </p>
        <div className="lp-hero-cta-wrap" data-hero-reveal>
          <span className="lp-hero-cta-glow" aria-hidden="true" />
          <button type="button" className="lp-btn lp-hero-cta" onClick={onPrimary}>
            {t("landing.hero.cta")}
          </button>
        </div>
      </div>

      <div className="lp-scroll-hint" aria-hidden="true">
        <span>SCROLL</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </header>
  )
}
