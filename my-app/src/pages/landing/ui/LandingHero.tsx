import { type FormEvent, useState } from "react"
import type { AuthRoute } from "@/app/router/authRoute"
import { CabinetMark } from "./CabinetMark"
import { revealDelay } from "./useScrollReveal"

interface LandingHeroProps {
  onNavigateAuth: (route: AuthRoute, params?: { email?: string }) => void
  onDemo: () => void
}

export function LandingHero({ onNavigateAuth, onDemo }: LandingHeroProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onNavigateAuth("signup", { email: email.trim() })
  }

  return (
    <header className="lp-hero" id="top">
      <div className="lp-hero-stars" aria-hidden="true" />
      <div className="lp-hero-glow" aria-hidden="true" />

      <div className="lp-hero-inner">
        <span className="lp-hero-eyebrow lp-reveal" style={revealDelay(0)}>
          <span className="tag">v1.0</span> AI 자동 회고가 도착했습니다
        </span>

        <h1 className="lp-reveal" style={revealDelay(90)}>
          흩어진 하루가
          <br />
          <span className="accent">저절로 정리되는 곳</span>
        </h1>

        <p className="lp-hero-sub lp-reveal" style={revealDelay(180)}>
          일정과 할 일, 그리고 하루의 회고. 따로 놀던 기록들이 하나의 흐름으로
          이어지고, 매일의 커밋과 함께 GitHub 저장소에 자동으로 보관됩니다.
        </p>

        <div className="lp-capture lp-reveal" style={revealDelay(270)}>
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

        <p className="lp-capture-note lp-reveal" style={revealDelay(350)}>
          당신의 시간을 낭비하지 않게 해주는 도구 A.R.C.H.I.V.E, 지금 바로
          경험해보세요.
        </p>
      </div>

      {/* product UI showcase — authentic calendar mock */}
      <div className="lp-hero-art lp-reveal" style={revealDelay(120)}>
        <span
          className="lp-orb lp-orb-1 lp-reveal"
          aria-hidden="true"
          style={revealDelay(250)}
        />
        <span
          className="lp-orb lp-orb-2 lp-reveal"
          aria-hidden="true"
          style={revealDelay(300)}
        />
        <div
          className="lp-window"
          role="img"
          aria-label="A.R.C.H.I.V.E 캘린더 화면 미리보기">
          <div className="lp-window-bar">
            <span className="lp-window-url">
              <CabinetMark />
              archive.app / calendar
            </span>
          </div>
          <div className="lp-window-body">
            <div className="lp-win-main">
              <div className="lp-win-head">
                <div>
                  <p className="lp-win-ey">Planning Canvas</p>
                  <p className="lp-win-title">2026년 6월</p>
                </div>
                <div className="lp-win-seg">
                  <span>1 Week</span>
                  <span className="on">1 Month</span>
                </div>
              </div>
              <div className="lp-month">
                <div className="lp-month-dow">
                  <span style={{ color: "var(--color-warn)" }}>SUN</span>
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                </div>
                <div className="lp-month-grid">
                  {MONTH_CELLS.map((cell, i) => (
                    <div
                      key={i}
                      className={`lp-cell${cell.today ? " today" : ""}${cell.out ? " out" : ""}`}>
                      <span className="d">
                        {cell.day}
                        {cell.today ? <em>TODAY</em> : null}
                      </span>
                      {cell.chips?.map((chip, j) => (
                        <span key={j} className={`chip ${chip.kind}`}>
                          {chip.label}
                        </span>
                      ))}
                      {cell.more ? (
                        <span className="more">+{cell.more}개 더 보기</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

type Chip = { label: string; kind: "done" | "prog" | "todo" }
type Cell = {
  day: number
  today?: boolean
  out?: boolean
  chips?: Chip[]
  more?: number
}

const D = (label: string): Chip => ({ label, kind: "done" })

const MONTH_CELLS: Cell[] = [
  // week 1 (Oct 1 = Sunday)
  { day: 1 },
  { day: 2, chips: [D("스프린트 계획")] },
  { day: 3 },
  { day: 4, chips: [D("API 설계")] },
  { day: 5 },
  { day: 6, chips: [D("코드 리뷰")] },
  { day: 7 },
  // week 2
  { day: 8 },
  { day: 9, chips: [D("회고 작성")] },
  { day: 10, chips: [D("토큰 정리")] },
  { day: 11 },
  { day: 12, chips: [D("UI 검수")] },
  { day: 13 },
  { day: 14 },
  // week 3
  { day: 15 },
  { day: 16, chips: [D("배포 준비")] },
  { day: 17, chips: [D("캐시 전략")] },
  { day: 18 },
  { day: 19, chips: [D("와이어프레임")] },
  { day: 20, chips: [D("QA")] },
  { day: 21 },
  // week 4
  { day: 22 },
  { day: 23, chips: [D("캐시 정리")] },
  { day: 24, chips: [D("와이어프레임")] },
  {
    day: 25,
    today: true,
    chips: [
      { label: "Sub-header 작업", kind: "prog" },
      { label: "프롬프트 다듬기", kind: "prog" },
    ],
    more: 1,
  },
  { day: 26, chips: [{ label: "토큰 검수", kind: "todo" }] },
  { day: 27, chips: [{ label: "주간 회고", kind: "todo" }] },
  { day: 28, chips: [{ label: "리포 정리", kind: "todo" }] },
  // week 5
  { day: 29 },
  { day: 30, chips: [{ label: "월간 회고", kind: "todo" }] },
  { day: 31 },
  { day: 1, out: true },
  { day: 2, out: true },
  { day: 3, out: true },
  { day: 4, out: true },
]
