import type { ReactNode } from "react"
import { revealDelay } from "./useScrollReveal"

interface LandingFeaturesProps {
  onDemoTodos: () => void
  onDemoRetro: () => void
  onDemoSettings: () => void
}

export function LandingFeatures({
  onDemoTodos,
  onDemoRetro,
  onDemoSettings,
}: LandingFeaturesProps) {
  return (
    <>
      {/* ── Three Pillars ─────────────────────────────────── */}
      <section className="lp-section" id="features">
        <div className="lp-section-head lp-reveal" style={revealDelay(0)}>
          <p className="lp-section-eyebrow">One workflow</p>
          <h2>세 개의 화면, 하나의 흐름</h2>
          <p>
            계획하고, 정리하고, 되돌아보는 일을 한 자리에서. 각 화면은 서로
            끊기지 않고 자연스럽게 이어집니다.
          </p>
        </div>

        <div className="lp-pillars">
          <Pillar
            delay={80}
            icon={<IconCalendar />}
            eyebrow="Planning Canvas"
            title="캘린더"
            body="주간·월간 일정과 작업 카드를 한 화면에서. 카드를 누르면 우측에서 디테일이 펼쳐지고, 오늘은 언제나 액션 블루로 강조됩니다."
          />
          <Pillar
            delay={200}
            icon={<IconKanban />}
            eyebrow="Editorial Kanban"
            title="할 일"
            body="자연어로 적는 순간 칸반에 정렬됩니다. 시작 전 · 진행 중 · 완료, 세 열로 하루의 흐름을 한눈에 정리하세요."
          />
          <Pillar
            delay={320}
            icon={<IconLedger />}
            eyebrow="Writing Ledger"
            title="회고"
            body="완료한 작업과 오늘의 커밋이 자동으로 모입니다. 배운 점만 적으면, 나머지는 GitHub 저장소에 안전하게 동기화됩니다."
          />
        </div>
      </section>

      {/* ── Discord-style feature cards ───────────────────── */}
      <section className="lp-section" id="workflow" style={{ paddingTop: 0 }}>
        {/* card 1 — kanban */}
        <section className="lp-feature-screen">
          <div className="lp-feature lp-feature-grad-1">
            <div className="lp-feature-text lp-reveal" style={revealDelay(0)}>
              <p className="ey">Quick Capture</p>
              <h3>적는 순간, 보드에 정렬됩니다</h3>
              <p>
                떠오른 일을 한 줄로 적으면 됩니다. 날짜를 비워두면 오늘로,
                적으면 그 날짜의 캘린더로 — 입력하는 즉시 알맞은 자리를
                찾아갑니다.
              </p>
              <button
                type="button"
                className="lp-feature-cta"
                onClick={onDemoTodos}>
                칸반 체험하기 →
              </button>
            </div>
            <div
              className="lp-mock lp-reveal"
              style={revealDelay(140)}
              aria-hidden="true">
              <MockHead title="to-dos · editorial kanban" />
              <div className="lp-mock-kanban">
                <div className="lp-mock-col">
                  <p className="lp-mock-col-h">시작 전</p>
                  <div className="lp-mock-card">OAuth 콜백 점검</div>
                  <div className="lp-mock-card">다크 토큰 검수</div>
                </div>
                <div className="lp-mock-col">
                  <p className="lp-mock-col-h">진행 중</p>
                  <div className="lp-mock-card blue">Sub-header 작업</div>
                  <div className="lp-mock-card">프롬프트 다듬기</div>
                </div>
                <div className="lp-mock-col">
                  <p className="lp-mock-col-h">완료</p>
                  <div className="lp-mock-card done">캐시 전략 정리</div>
                  <div className="lp-mock-card done">와이어프레임</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* card 2 — github sync */}
        <section className="lp-feature-screen">
          <div className="lp-feature lp-feature-grad-2 reverse" id="sync">
            <div
              className="lp-mock lp-reveal"
              style={revealDelay(140)}
              aria-hidden="true">
              <MockHead title="retrospectives · 오늘의 커밋" />
              <Commit
                repo="archive-app"
                msg="feat(calendar): sticky sub-header"
                sha="8f23c41"
              />
              <Commit
                repo="archive-app"
                msg="fix(toast): auto-dismiss timing"
                sha="1a44b09"
              />
              <Commit
                repo="design-tokens"
                msg="chore: bump dark palette"
                sha="c0a8d1e"
              />
              <div className="lp-commit-synced">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#27a644"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <polyline points="4 12 10 18 20 6" />
                </svg>
                <span>@rangkim/archive-journal 에 동기화됨</span>
              </div>
            </div>
            <div className="lp-feature-text lp-reveal" style={revealDelay(0)}>
              <p className="ey">GitHub Sync</p>
              <h3>회고는 커밋과 함께 보관됩니다</h3>
              <p>
                추적할 저장소만 골라두면, 그날의 커밋이 회고에 자동으로
                묶입니다. 기록은 흩어지지 않고 당신의 GitHub 계정에 그대로
                남습니다.
              </p>
              <button
                type="button"
                className="lp-feature-cta"
                onClick={onDemoRetro}>
                연동 살펴보기 →
              </button>
            </div>
          </div>
        </section>

        {/* card 3 — AI auto-retro */}
        <section className="lp-feature-screen">
          <div className="lp-feature lp-feature-grad-3" id="ai">
            <div className="lp-feature-text lp-reveal" style={revealDelay(0)}>
              <p className="ey">AI Auto-Retrospective</p>
              <h3>주간 요약은, 묻지 않아도 도착합니다</h3>
              <p>
                매주 일요일 자정 · 매월 말일 · 매년 마지막 날. 그동안의 흐름을
                AI가 스스로 정리해 마크다운 요약으로 만들고, 우상단 토스트로
                살며시 알려드립니다.
              </p>
              <button
                type="button"
                className="lp-feature-cta"
                onClick={onDemoSettings}>
                템플릿 편집기 보기 →
              </button>
            </div>
            <div
              className="lp-mock lp-reveal"
              style={revealDelay(140)}
              aria-hidden="true">
              <div className="lp-mock-head">
                <span
                  className="lp-mock-dot"
                  style={{ background: "#5e6ad2" }}
                />
                <span className="lp-mock-title" style={{ marginLeft: 0 }}>
                  주간 기록 요약 · 자동 생성됨
                </span>
              </div>
              <div className="lp-mock-summary">
                <p className="h"># 이번 주의 흐름</p>
                <p style={{ margin: "0 0 4px" }}>
                  관찰한 흐름 — 캘린더와 회고를 잇는 작업에 시간이
                  집중되었습니다.
                </p>
                <p className="muted">완료 11건 · 커밋 34개 · 회고 5회</p>
                <p className="lead">다음 액션</p>
                <p className="next">→ backdrop-filter 모바일 성능 점검</p>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* ── Quote ─────────────────────────────────────────── */}
      <section className="lp-quote">
        <blockquote className="lp-reveal" style={revealDelay(0)}>
          &ldquo;도구와 트렌드는 바뀌어도,{" "}
          <span className="hl">남겨둔 기록은 사라지지 않는다.</span> 하루의
          끝에서 모든 것이 한 자리에 모인다.&rdquo;
        </blockquote>
        <cite className="lp-reveal" style={revealDelay(150)}>
          — A.R.C.H.I.V.E의 설계 원칙
        </cite>
      </section>
    </>
  )
}

function Pillar({
  icon,
  eyebrow,
  title,
  body,
  delay,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  body: string
  delay: number
}) {
  return (
    <article className="lp-pillar lp-reveal" style={revealDelay(delay)}>
      <span className="lp-pillar-icon">{icon}</span>
      <p className="ey">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}

function MockHead({ title }: { title: string }) {
  return (
    <div className="lp-mock-head">
      <span className="lp-mock-dot" style={{ background: "#ff5f57" }} />
      <span className="lp-mock-dot" style={{ background: "#febc2e" }} />
      <span className="lp-mock-dot" style={{ background: "#28c840" }} />
      <span className="lp-mock-title">{title}</span>
    </div>
  )
}

function Commit({
  repo,
  msg,
  sha,
}: {
  repo: string
  msg: string
  sha: string
}) {
  return (
    <div className="lp-commit">
      <span className="repo">{repo}</span>
      <span className="msg">{msg}</span>
      <span className="sha">{sha}</span>
    </div>
  )
}

/* ── Pillar icons (lucide-style inline stroke SVG) ─────────── */
const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function IconCalendar() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  )
}

function IconKanban() {
  return (
    <svg {...ICON_PROPS}>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconLedger() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}
