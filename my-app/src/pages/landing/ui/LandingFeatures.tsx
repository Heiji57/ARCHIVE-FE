import { useEffect, useRef, useState } from "react"
import { useTranslation } from "@/shared/lib/i18n"
import type { TranslateFn } from "@/shared/lib/i18n"
import { calDays, getShowcaseTabs } from "./landingData"

/** 미니 캘린더 (bento · showcase 프리뷰 공용) */
function MiniCalendar({ t }: { t: TranslateFn }) {
  const days = calDays(t)
  const dow = [
    t("landing.calendar.dow.sun"),
    t("landing.calendar.dow.mon"),
    t("landing.calendar.dow.tue"),
    t("landing.calendar.dow.wed"),
    t("landing.calendar.dow.thu"),
    t("landing.calendar.dow.fri"),
    t("landing.calendar.dow.sat"),
  ]
  return (
    <>
      <div className="lp-mini-dow">
        {dow.map((d, i) => (
          <span key={d} className={i === 0 ? "sun" : undefined}>
            {d}
          </span>
        ))}
      </div>
      <div className="lp-mini-grid">
        {days.map((d, i) => (
          <div key={i} style={d.style}>
            <span style={d.numStyle}>{d.n}</span>
            {d.chip ? <span style={d.chipStyle}>{d.chip}</span> : null}
          </div>
        ))}
      </div>
    </>
  )
}

function Check({ size = 11, stroke = "#27a644" }: { size?: number; stroke?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <polyline points="4 12 10 18 20 6" />
    </svg>
  )
}

/* ── Pillars — bento grid ──────────────────────────────── */
function Pillars({ t }: { t: TranslateFn }) {
  return (
    <section id="pillars" className="lp-section lp-snap-screen">
      <div className="lp-section-head lp-reveal" data-reveal="0">
        <p className="lp-eyebrow">One workspace</p>
        <h2>{t("landing.pillars.title")}</h2>
      </div>

      <div className="lp-bento">
        {/* CALENDAR */}
        <div className="lp-card lp-card--cal lp-reveal" data-reveal="1">
          <p className="lp-card-ey">CALENDAR</p>
          <h3>{t("nav.calendar")}</h3>
          <p className="desc">{t("landing.pillars.calendar.desc")}</p>
          <div className="lp-mini-cal">
            <div className="lp-mini-cal-head">
              <span className="m">{t("landing.calendar.monthLabel")}</span>
              <span className="lp-mini-seg">
                <span>{t("landing.calendar.week")}</span>
                <span className="on">{t("landing.calendar.month")}</span>
              </span>
            </div>
            <MiniCalendar t={t} />
          </div>
        </div>

        {/* KANBAN */}
        <div className="lp-card lp-reveal" data-reveal="2">
          <p className="lp-card-ey">KANBAN</p>
          <h3>{t("nav.todos")}</h3>
          <div className="lp-card-todo-list">
            <div className="lp-todo-row prog">
              <span className="dot" style={{ background: "#828fff" }} />
              <span className="txt">{t("landing.mock.subheaderWork")}</span>
              <span className="tag">{t("landing.mock.tagInProgress")}</span>
            </div>
            <div className="lp-todo-row">
              <span
                className="dot"
                style={{ border: "1.5px solid #62666d", background: "transparent" }}
              />
              <span className="txt" style={{ color: "#d0d6e0" }}>
                {t("landing.mock.oauthCheck")}
              </span>
            </div>
            <div className="lp-todo-row done">
              <Check />
              <span className="txt line">{t("landing.mock.cacheStrategy")}</span>
            </div>
          </div>
        </div>

        {/* LEDGER */}
        <div className="lp-card lp-reveal" data-reveal="3">
          <p className="lp-card-ey">LEDGER</p>
          <h3>{t("nav.retrospectives")}</h3>
          <div className="lp-card-todo-list">
            <div className="lp-retro-row">
              <Check />
              <span className="line">{t("landing.mock.cacheStrategy")}</span>
            </div>
            <div className="lp-retro-row">
              <Check />
              <span className="line">{t("landing.mock.wireframe")}</span>
            </div>
            <div className="lp-retro-foot">
              <span>{t("landing.mock.ledgerFootNote")}</span>
            </div>
          </div>
        </div>

        {/* AI SUMMARY */}
        <div className="lp-card lp-card--ai lp-reveal" data-reveal="4">
          <div style={{ flex: 1 }}>
            <p className="ey">{t("landing.mock.aiWeeklyLabel")}</p>
            <p className="lead">{t("landing.pillars.ai.lead")}</p>
            <div className="stats">
              <span>
                <b>11</b> {t("landing.mock.labelDone")}
              </span>
              <span>
                <b>8</b> {t("landing.mock.labelCommits")}
              </span>
              <span>
                <b>5</b> {t("landing.mock.labelRetros")}
              </span>
            </div>
          </div>
          <svg
            viewBox="0 0 120 44"
            style={{ width: 140, height: 44, flexShrink: 0 }}>
            <polyline
              points="0,36 20,30 40,32 60,20 80,24 100,10 120,6"
              fill="none"
              stroke="#828fff"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* GITHUB SYNC */}
        <div className="lp-card lp-card--sync lp-reveal" data-reveal="5">
          <i />
          <div>
            <p className="ey">GITHUB SYNC</p>
            <p>{t("landing.pillars.githubSync.desc")}</p>
          </div>
        </div>

        {/* LANGUAGES */}
        <div className="lp-card lp-card--lang lp-reveal" data-reveal="6">
          <span className="ey">4 LANGUAGES</span>
          {["한국어", "English", "中文", "日本語"].map((l) => (
            <span key={l} className="lp-lang-pill">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Marquee ───────────────────────────────────────────── */
function MarqueeGroup({ t, ariaHidden }: { t: TranslateFn; ariaHidden?: boolean }) {
  const items = [
    t("landing.marquee.daily"),
    t("landing.marquee.weekly"),
    t("landing.marquee.monthly"),
    t("landing.marquee.yearly"),
    t("landing.marquee.githubSync"),
    t("landing.marquee.globalSearch"),
    "한국어 · English · 中文 · 日本語",
  ]
  return (
    <span className="lp-marquee-group" aria-hidden={ariaHidden}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} style={{ display: "inline-flex", gap: 40 }}>
          <span>{item}</span>
          <span className="sep">◆</span>
        </span>
      ))}
    </span>
  )
}

function Marquee({ t }: { t: TranslateFn }) {
  return (
    <div className="lp-marquee">
      <div className="lp-marquee-track" data-marquee>
        <MarqueeGroup t={t} />
        <MarqueeGroup t={t} ariaHidden />
      </div>
    </div>
  )
}

/* ── Showcase — tabbed product preview ─────────────────── */
function Showcase({ t }: { t: TranslateFn }) {
  const [active, setActive] = useState(0)
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([])
  const inkRef = useRef<HTMLSpanElement>(null)
  const tabs = getShowcaseTabs(t)

  useEffect(() => {
    const moveInk = () => {
      const el = tabsRef.current[active]
      const ink = inkRef.current
      if (el && ink) {
        ink.style.width = `${el.offsetWidth}px`
        ink.style.transform = `translateX(${el.offsetLeft}px)`
      }
    }
    moveInk()
    window.addEventListener("resize", moveInk)
    return () => window.removeEventListener("resize", moveInk)
  }, [active, tabs])

  const tab = tabs[active]

  return (
    <section id="numbers" className="lp-section lp-snap-screen">
      <Marquee t={t} />

      <div className="lp-section-head lp-reveal" data-reveal="0" style={{ marginBottom: 36 }}>
        <p className="lp-eyebrow">Explore the product</p>
        <h2>{t("landing.showcase.title")}</h2>
      </div>

      <div className="lp-reveal" data-reveal="1">
        <div className="lp-tabs">
          {tabs.map((tb, i) => (
            <button
              key={tb.title}
              type="button"
              ref={(el) => {
                tabsRef.current[i] = el
              }}
              className="lp-tab"
              data-active={i === active ? "1" : "0"}
              onClick={() => setActive(i)}>
              {tb.title}
            </button>
          ))}
          <span className="lp-tab-ink" ref={inkRef} />
        </div>

        <div className="lp-showcase-grid">
          <div className="lp-showcase-copy">
            <h3>{tab.title}</h3>
            <p>{tab.body}</p>
            <button
              type="button"
              className="lp-footer-link"
              style={{ color: "#828fff", fontSize: 14 }}
              onClick={() =>
                document
                  .getElementById("cta")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }>
              {tab.link} →
            </button>
          </div>

          <div className="lp-showcase-visual">
            {active === 0 ? (
              <div className="lp-preview">
                <div className="lp-preview-head">
                  <p className="m">{t("landing.calendar.monthLabel")}</p>
                  <span className="lp-mini-seg">
                    <span>{t("landing.calendar.week")}</span>
                    <span className="on">{t("landing.calendar.month")}</span>
                  </span>
                </div>
                <MiniCalendar t={t} />
              </div>
            ) : null}

            {active === 1 ? (
              <div className="lp-preview">
                <div className="lp-preview-kanban">
                  <div className="lp-kan-col">
                    <p className="lp-kan-col-h">{t("landing.mock.colNotStarted")}</p>
                    <div className="lp-kan-card" style={{ opacity: 1 }}>
                      {t("landing.mock.oauthCheck")}
                    </div>
                    <div className="lp-kan-card" style={{ opacity: 1, marginBottom: 0 }}>
                      {t("landing.mock.darkTokenReview")}
                    </div>
                  </div>
                  <div className="lp-kan-col">
                    <p className="lp-kan-col-h">{t("landing.mock.colInProgress")}</p>
                    <div className="lp-kan-card prog" style={{ opacity: 1 }}>
                      {t("landing.mock.subheaderWork")}
                    </div>
                    <div className="lp-kan-card" style={{ opacity: 1, marginBottom: 0 }}>
                      {t("landing.mock.promptPolish")}
                    </div>
                  </div>
                  <div className="lp-kan-col">
                    <p className="lp-kan-col-h">{t("landing.mock.colDone")}</p>
                    <div className="lp-kan-card done" style={{ opacity: 1 }}>
                      {t("landing.mock.cacheStrategy")}
                    </div>
                    <div className="lp-kan-card done" style={{ opacity: 1, marginBottom: 0 }}>
                      {t("landing.mock.wireframe")}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {active === 2 ? (
              <div className="lp-preview">
                <div className="lp-preview-retro-head">
                  <p>{t("landing.mock.retroDateLabel")}</p>
                  <span>{t("landing.mock.retroDow")}</span>
                </div>
                <div className="lp-preview-retro-list">
                  <div className="row">
                    <Check size={13} stroke="#27a644" />
                    <span className="line">{t("landing.mock.cacheStrategy")}</span>
                  </div>
                  <div className="row">
                    <Check size={13} stroke="#27a644" />
                    <span className="line">{t("landing.mock.wireframeReview")}</span>
                  </div>
                </div>
                <div className="lp-preview-commits">
                  <div className="row">
                    <span className="time">{t("landing.mock.log1Time")}</span>
                    <span className="text">{t("landing.mock.log1Text")}</span>
                  </div>
                  <div className="row">
                    <span className="time">{t("landing.mock.log2Time")}</span>
                    <span className="text">{t("landing.mock.log2Text")}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {active === 3 ? (
              <div className="lp-preview lp-preview-ai">
                <p className="h">
                  <i />
                  {t("landing.mock.weeklySummaryAuto")}
                </p>
                <div className="lp-preview-ai-body">
                  <p className="t">{t("landing.mock.weeklyFlowHeading")}</p>
                  <p className="d">{t("landing.mock.weeklyFlowBodyFull")}</p>
                  <p className="meta">{t("landing.mock.showcaseAiMeta")}</p>
                </div>
                <div className="lp-preview-ai-foot">
                  <span className="next">{t("landing.mock.nextAction")}</span>
                  <svg
                    viewBox="0 0 140 40"
                    style={{ flex: 1, height: 36 }}
                    preserveAspectRatio="none">
                    <polyline
                      points="0,32 24,26 48,28 72,16 96,20 120,8 140,5"
                      fill="none"
                      stroke="#828fff"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Quote ─────────────────────────────────────────────── */
function Quote({ t }: { t: TranslateFn }) {
  return (
    <section className="lp-quote lp-snap-screen">
      <blockquote className="lp-reveal" data-reveal="0">
        &ldquo;{t("landing.quote.part1")}
        <span className="hl">{t("landing.quote.highlight")}</span>
        {t("landing.quote.part2")}&rdquo;
      </blockquote>
      <cite className="lp-reveal" data-reveal="2">
        {t("landing.quote.cite")}
      </cite>
    </section>
  )
}

export function LandingFeatures() {
  const { t } = useTranslation()
  return (
    <>
      <Pillars t={t} />
      <Showcase t={t} />
      <Quote t={t} />
    </>
  )
}
