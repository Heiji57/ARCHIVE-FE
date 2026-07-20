import { useTranslation } from "@/shared/lib/i18n"
import { calCells } from "./landingData"

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

export function LandingFlow() {
  const { t } = useTranslation()
  const cells = calCells(t)

  const NODES = [
    {
      idx: "01 · PLANNING CANVAS",
      title: t("landing.flow.node1.title"),
      body: t("landing.flow.node1.body"),
    },
    {
      idx: "02 · EDITORIAL KANBAN",
      title: t("landing.flow.node2.title"),
      body: t("landing.flow.node2.body"),
    },
    {
      idx: "03 · WRITING LEDGER",
      title: t("landing.flow.node3.title"),
      body: t("landing.flow.node3.body"),
    },
  ]

  return (
    <section id="flow" className="lp-flow" data-pin-wrap>
      <div className="lp-flow-stage" data-pin-stage>
        <div className="lp-flow-inner">
          {/* 좌측 — 3 노드 */}
          <div>
            <p className="lp-flow-eyebrow">The flow of a day</p>
            <div className="lp-flow-nodes">
              {NODES.map((n, i) => (
                <div key={i} className="lp-flow-node" data-node={i}>
                  <span className="lp-flow-node-dotwrap">
                    <span className="lp-flow-node-dot" data-node-dot={i} />
                  </span>
                  <div>
                    <p className="lp-flow-node-idx">{n.idx}</p>
                    <h3>{n.title}</h3>
                    <p className="lp-flow-node-body" data-node-body={i}>
                      {n.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 우측 — 브라우저 프레임 */}
          <div className="lp-frame-wrap">
            <div className="lp-frame">
              <div className="lp-frame-bar">
                <span className="lp-frame-dot" />
                <span className="lp-frame-dot" />
                <span className="lp-frame-dot" />
                <span className="lp-frame-url" data-frame-url>
                  archive.app / calendar
                </span>
                <span className="lp-frame-synced">
                  <i />
                  synced
                </span>
              </div>

              <div className="lp-frame-body">
                {/* ACT 1 · calendar */}
                <div className="lp-act" data-act="0">
                  <div className="lp-cal-head">
                    <div>
                      <p className="ey">Planning Canvas</p>
                      <p className="title">{t("landing.calendar.monthLabel")}</p>
                    </div>
                    <div className="lp-seg">
                      <span>1 Week</span>
                      <span className="on">1 Month</span>
                    </div>
                  </div>
                  <div className="lp-dow">
                    {DOW.map((d, i) => (
                      <span key={d} className={i === 0 ? "sun" : undefined}>
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="lp-cal-grid">
                    {cells.map((cell, i) => (
                      <div key={i} style={cell.style}>
                        <span style={cell.dStyle}>
                          {cell.day}
                          {cell.today ? (
                            <em
                              style={{
                                fontStyle: "normal",
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                color: "#828fff",
                                marginLeft: "3px",
                              }}>
                              TODAY
                            </em>
                          ) : null}
                        </span>
                        {cell.chipLabel ? (
                          <span style={cell.chipStyle}>{cell.chipLabel}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACT 2 · kanban */}
                <div className="lp-act" data-act="1" style={{ opacity: 0 }}>
                  <p className="lp-act-title">Editorial Kanban</p>
                  <div className="lp-kan-grid">
                    <div className="lp-kan-col">
                      <p className="lp-kan-col-h">{t("landing.mock.colNotStarted")}</p>
                      <div className="lp-kan-card" data-kan="0">
                        {t("landing.mock.oauthCheck")}
                      </div>
                      <div className="lp-kan-card" data-kan="1">
                        {t("landing.mock.darkTokenReview")}
                      </div>
                    </div>
                    <div className="lp-kan-col">
                      <p className="lp-kan-col-h">{t("landing.mock.colInProgress")}</p>
                      <div className="lp-kan-card prog" data-kan="2">
                        {t("landing.mock.subheaderWork")}
                      </div>
                      <div className="lp-kan-card" data-kan="3">
                        {t("landing.mock.promptPolish")}
                      </div>
                    </div>
                    <div className="lp-kan-col">
                      <p className="lp-kan-col-h">{t("landing.mock.colDone")}</p>
                      <div className="lp-kan-card done" data-kan="4">
                        {t("landing.mock.cacheStrategy")}
                      </div>
                      <div className="lp-kan-card done" data-kan="5">
                        {t("landing.mock.wireframe")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACT 3 · retro + 오늘의 기록 + AI */}
                <div className="lp-act" data-act="2" style={{ opacity: 0 }}>
                  <p className="lp-act-title">{t("landing.flow.act3.title")}</p>
                  <div className="lp-commit-list">
                    <div className="lp-commit" data-commit="0">
                      <span className="time">{t("landing.mock.log1Time")}</span>
                      <span className="text">{t("landing.mock.log1Text")}</span>
                    </div>
                    <div className="lp-commit" data-commit="1">
                      <span className="time">{t("landing.mock.log2Time")}</span>
                      <span className="text">{t("landing.mock.log2Text")}</span>
                    </div>
                    <div className="lp-commit" data-commit="2">
                      <span className="time">{t("landing.mock.log3Time")}</span>
                      <span className="text">{t("landing.mock.log3Text")}</span>
                    </div>
                  </div>
                  <div className="lp-sum-box">
                    <p className="h">
                      <i />
                      {t("landing.mock.weeklySummaryAuto")}
                    </p>
                    <div className="lp-sum-text" data-sum />
                  </div>
                  <div className="lp-toast" data-toast>
                    <i />
                    <span>{t("landing.mock.toastArrived")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
