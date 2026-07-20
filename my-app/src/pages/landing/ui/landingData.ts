import type { CSSProperties } from "react"
import type { TranslateFn } from "@/shared/lib/i18n"

/** flow 1막 · 캘린더 셀 (6월 30일 + 다음 달 5칸) */
export interface CalCell {
  day: number
  today: boolean
  style: CSSProperties
  dStyle: CSSProperties
  chipLabel?: string
  chipStyle?: CSSProperties
}

type Kind = "prog" | "todo" | "done"

/** 날짜별 목업 칩 — 값은 landing.mock.* 번역 키 */
const ACT_CHIPS = (t: TranslateFn): Record<number, [string, Kind]> => ({
  2: [t("landing.mock.sprint"), "done"],
  4: [t("landing.mock.apiDesign"), "done"],
  6: [t("landing.mock.codeReview"), "done"],
  9: [t("landing.mock.retroWriting"), "done"],
  12: [t("landing.mock.uiReview"), "done"],
  16: [t("landing.mock.deployPrep"), "done"],
  20: ["QA", "done"],
  24: [t("landing.mock.wireframe"), "done"],
  25: [t("landing.mock.subheaderWork"), "prog"],
  26: [t("landing.mock.tokenReview"), "todo"],
  27: [t("landing.mock.weeklyRetro"), "todo"],
  30: [t("landing.mock.monthlyRetro"), "todo"],
})

export function calCells(t: TranslateFn): CalCell[] {
  const chipsByDay = ACT_CHIPS(t)
  const cells: CalCell[] = []
  for (let d = 1; d <= 30; d++) {
    const today = d === 25
    const chip = chipsByDay[d]
    const cell: CalCell = {
      day: d,
      today,
      style: {
        background: today ? "rgba(94,106,210,0.09)" : "#0f1011",
        border: today
          ? "1px solid rgba(94,106,210,0.35)"
          : "1px solid rgba(35,37,42,0.7)",
        borderRadius: "6px",
        padding: "4px 4px 5px",
        minHeight: "44px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      },
      dStyle: {
        fontSize: "11px",
        fontWeight: 600,
        color: today ? "#828fff" : "#f7f8f8",
        display: "flex",
        alignItems: "center",
      },
    }
    if (chip) {
      cell.chipLabel = chip[0]
      const cs: CSSProperties = {
        fontSize: "9.5px",
        lineHeight: 1.2,
        padding: "2px 5px",
        borderRadius: "4px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }
      if (chip[1] === "prog")
        Object.assign(cs, { background: "rgba(94,106,210,0.18)", color: "#828fff" })
      else if (chip[1] === "todo")
        Object.assign(cs, { background: "#141516", color: "#f7f8f8" })
      else
        Object.assign(cs, {
          background: "#18191a",
          color: "#8a8f98",
          textDecoration: "line-through",
        })
      cell.chipStyle = cs
    }
    cells.push(cell)
  }
  // 다음 달로 넘어가는 흐린 칸
  for (let d = 1; d <= 5; d++) {
    cells.push({
      day: d,
      today: false,
      style: {
        background: "#0f1011",
        border: "1px solid rgba(35,37,42,0.4)",
        borderRadius: "6px",
        padding: "4px",
        minHeight: "44px",
        opacity: 0.35,
      },
      dStyle: { fontSize: "11px", fontWeight: 600, color: "#62666d" },
    })
  }
  return cells
}

/** 미니 캘린더 셀 (bento / showcase 프리뷰용, 28칸) */
export interface CalDay {
  n: number
  style: CSSProperties
  numStyle: CSSProperties
  chip?: string
  chipStyle?: CSSProperties
}

const MINI_CHIPS = (t: TranslateFn): Record<number, [string, Kind]> => ({
  4: [t("landing.mock.miniMeeting"), "done"],
  6: [t("landing.mock.miniReview"), "done"],
  12: [t("landing.mock.miniCheck"), "prog"],
  15: [t("landing.mock.miniDeploy"), "done"],
  18: ["QA", "todo"],
  25: [t("landing.mock.miniRetro"), "prog"],
})

export function calDays(t: TranslateFn): CalDay[] {
  const chipsByDay = MINI_CHIPS(t)
  const days: CalDay[] = []
  for (let i = 0; i < 28; i++) {
    const n = i + 1
    const today = n === 25
    const chip = chipsByDay[n]
    const day: CalDay = {
      n,
      style: {
        position: "relative",
        minHeight: "34px",
        borderRadius: "5px",
        padding: "4px 5px",
        background: today ? "rgba(94,106,210,0.10)" : "#010102",
        border: today
          ? "1px solid rgba(94,106,210,0.4)"
          : "1px solid rgba(35,37,42,0.55)",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        overflow: "hidden",
      },
      numStyle: {
        fontSize: "9px",
        fontWeight: 600,
        color: today ? "#828fff" : n % 7 === 0 ? "#d9a23a" : "#8a8f98",
      },
      chip: chip ? chip[0] : undefined,
    }
    if (chip) {
      const cs: CSSProperties = {
        fontSize: "8px",
        lineHeight: 1.2,
        padding: "1px 3px",
        borderRadius: "3px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }
      if (chip[1] === "prog")
        Object.assign(cs, { background: "rgba(94,106,210,0.25)", color: "#828fff" })
      else if (chip[1] === "todo")
        Object.assign(cs, { background: "#141516", color: "#d0d6e0" })
      else Object.assign(cs, { background: "#18191a", color: "#8a8f98" })
      day.chipStyle = cs
    }
    days.push(day)
  }
  return days
}

/** showcase 탭 데이터 */
export interface ShowcaseTab {
  title: string
  body: string
  link: string
}

export function getShowcaseTabs(t: TranslateFn): ShowcaseTab[] {
  return [
    {
      title: t("nav.calendar"),
      body: t("landing.showcase.tab.calendar.body"),
      link: t("landing.showcase.tab.calendar.link"),
    },
    {
      title: t("nav.todos"),
      body: t("landing.showcase.tab.todos.body"),
      link: t("landing.showcase.tab.todos.link"),
    },
    {
      title: t("nav.retrospectives"),
      body: t("landing.showcase.tab.retro.body"),
      link: t("landing.showcase.tab.retro.link"),
    },
    {
      title: t("landing.showcase.tab.ai.title"),
      body: t("landing.showcase.tab.ai.body"),
      link: t("landing.showcase.tab.ai.link"),
    },
  ]
}
