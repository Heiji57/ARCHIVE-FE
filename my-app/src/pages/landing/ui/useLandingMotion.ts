import { useEffect, type RefObject } from "react"

/**
 * 랜딩 페이지 모션 오케스트레이터.
 *
 * 라이브러리 없이 window 스크롤 + IntersectionObserver + Web Animations API 만
 * 사용한다. rootRef 하위의 `data-*` 훅 요소들을 직접 제어한다.
 *
 * - 히어로 진입 연출 (grid / beam / mark / 단어 / 서브카피)
 * - `.lp-reveal[data-reveal]` 요소의 스크롤 등장 (stagger)
 * - 좌측 진행 rail (`data-rail-*`)
 * - 핀 고정 flow 섹션 3막 스크롤 스토리텔링
 */

const EASE = "cubic-bezier(0.22,0.61,0.36,1)"

const clamp = (v: number) => Math.max(0, Math.min(1, v))
const ease = (v: number) => v * v * (3 - 2 * v)

/** summaryText — flow 3막에서 타이핑되는 AI 요약 목업 본문 (locale 별로 호출부에서 전달) */
export function useLandingMotion(
  rootRef: RefObject<HTMLElement | null>,
  summaryText: string,
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const q = <T extends Element = HTMLElement>(sel: string) =>
      root.querySelector<T>(sel)
    const qa = <T extends Element = HTMLElement>(sel: string) =>
      Array.from(root.querySelectorAll<T>(sel))

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const cleanups: Array<() => void> = []

    // ── 히어로 진입 연출 ──────────────────────────────────
    {
      const grid = q<HTMLElement>("[data-hero-grid]")
      const beam = q<HTMLElement>("[data-hero-beam]")
      const mark = q<HTMLElement>("[data-hero-mark]")
      const words = qa<HTMLElement>("[data-hw]")
      const reveals = qa<HTMLElement>("[data-hero-reveal]")

      if (reduced) {
        if (grid) grid.style.opacity = "0.45"
        if (mark) mark.style.opacity = "1"
        words.forEach((el) => (el.style.opacity = "1"))
        reveals.forEach((el) => (el.style.opacity = "1"))
      } else {
        const timers: number[] = []
        if (mark) {
          timers.push(
            window.setTimeout(() => {
              mark.style.opacity = "1"
              mark.animate(
                [
                  { opacity: 0, transform: "scale(0.6)" },
                  { opacity: 1, transform: "scale(1)" },
                ],
                {
                  duration: 640,
                  easing: "cubic-bezier(0.34,1.56,0.64,1)",
                  fill: "backwards",
                },
              )
            }, 360),
          )
        }
        if (grid)
          grid.animate(
            [
              { opacity: 0, transform: "scale(1.14)" },
              { opacity: 0.45, transform: "scale(1)" },
            ],
            { duration: 950, easing: EASE, fill: "both" },
          )
        if (beam)
          beam.animate(
            [
              { left: "0%", opacity: 0 },
              { left: "8%", opacity: 1, offset: 0.12 },
              { left: "92%", opacity: 1, offset: 0.88 },
              { left: "100%", opacity: 0 },
            ],
            {
              duration: 1250,
              delay: 350,
              easing: "cubic-bezier(0.5,0,0.3,1)",
              fill: "forwards",
            },
          )
        words.forEach((el, i) => {
          timers.push(
            window.setTimeout(
              () => {
                el.style.opacity = "1"
                el.animate(
                  [
                    { opacity: 0, transform: "translateY(24px)", filter: "blur(10px)" },
                    { opacity: 1, transform: "none", filter: "blur(0)" },
                  ],
                  { duration: 640, easing: EASE, fill: "backwards" },
                )
              },
              560 + i * 170,
            ),
          )
        })
        reveals.forEach((el, i) => {
          timers.push(
            window.setTimeout(
              () => {
                el.style.opacity = "1"
                el.animate(
                  [
                    { opacity: 0, transform: "translateY(16px)" },
                    { opacity: 1, transform: "none" },
                  ],
                  { duration: 620, easing: EASE, fill: "backwards" },
                )
              },
              1500 + i * 110,
            ),
          )
        })
        cleanups.push(() => timers.forEach((t) => clearTimeout(t)))
      }
    }

    // ── 스크롤 등장 (reveal) ─────────────────────────────
    {
      const els = qa<HTMLElement>(".lp-reveal")
      if (reduced || typeof IntersectionObserver === "undefined") {
        els.forEach((el) => el.classList.add("is-visible"))
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (!en.isIntersecting) return
              const el = en.target as HTMLElement
              const idx = parseInt(el.dataset.reveal || "0", 10)
              el.style.transitionDelay = `${idx * 110}ms`
              el.classList.add("is-visible")
              io.unobserve(el)
            })
          },
          { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
        )
        els.forEach((el) => io.observe(el))
        cleanups.push(() => io.disconnect())
      }
    }

    // ── rail + 핀 고정 flow 스크롤 ────────────────────────
    {
      const railFill = q<HTMLElement>("[data-rail-fill]")
      const railDot = q<HTMLElement>("[data-rail-dot]")
      const railPct = q<HTMLElement>("[data-rail-pct]")
      const wrap = q<HTMLElement>("[data-pin-wrap]")
      const acts = [0, 1, 2].map((i) => q<HTMLElement>(`[data-act="${i}"]`))
      const nodes = [0, 1, 2].map((i) => q<HTMLElement>(`[data-node="${i}"]`))
      const dots = [0, 1, 2].map((i) => q<HTMLElement>(`[data-node-dot="${i}"]`))
      const bodies = [0, 1, 2].map((i) => q<HTMLElement>(`[data-node-body="${i}"]`))
      const frameUrl = q<HTMLElement>("[data-frame-url]")
      const kans = qa<HTMLElement>("[data-kan]")
      const commits = qa<HTMLElement>("[data-commit]")
      const sumEl = q<HTMLElement>("[data-sum]")
      const toast = q<HTMLElement>("[data-toast]")
      const URLS = [
        "archive.app / calendar",
        "archive.app / to-dos",
        "archive.app / retrospectives",
      ]
      let lastAct = -1
      let ticking = false

      const render = () => {
        ticking = false
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const gp = max > 0 ? clamp(window.scrollY / max) : 0
        if (railFill) railFill.style.height = `${gp * 100}%`
        if (railDot) railDot.style.top = `${gp * 100}%`
        if (railPct)
          railPct.textContent = String(Math.round(gp * 100)).padStart(2, "0")

        if (reduced || !wrap) return
        const wr = wrap.getBoundingClientRect()
        const total = wrap.offsetHeight - window.innerHeight
        if (total <= 0) return
        const p = clamp(-wr.top / total)

        const a1 = ease(clamp((p - 0.3) / 0.22))
        const a2 = ease(clamp((p - 0.62) / 0.22))
        if (acts[0]) {
          acts[0].style.opacity = String(1 - a1)
          acts[0].style.transform = `translateY(${-24 * a1}px) scale(${1 - 0.03 * a1})`
        }
        if (acts[1]) {
          acts[1].style.opacity = String(a1 * (1 - a2))
          acts[1].style.transform = `translateY(${24 * (1 - a1) - 24 * a2}px) scale(${0.97 + 0.03 * a1})`
        }
        if (acts[2]) {
          acts[2].style.opacity = String(a2)
          acts[2].style.transform = `translateY(${24 * (1 - a2)}px)`
        }

        const act = p < 0.34 ? 0 : p < 0.66 ? 1 : 2
        if (act !== lastAct) {
          lastAct = act
          if (frameUrl) frameUrl.textContent = URLS[act]
          nodes.forEach((n, i) => {
            if (n) n.style.opacity = i === act ? "1" : "0.4"
          })
          dots.forEach((dt, i) => {
            if (!dt) return
            const on = i === act
            dt.style.borderColor = on ? "#828fff" : "#34343a"
            dt.style.background = on ? "#828fff" : "#010102"
            dt.style.boxShadow = on ? "0 0 10px rgba(130,143,255,0.9)" : "none"
          })
          bodies.forEach((b, i) => {
            if (!b) return
            const on = i === act
            b.style.maxHeight = on ? "80px" : "0"
            b.style.opacity = on ? "1" : "0"
            b.style.marginTop = on ? "4px" : "0"
          })
        }

        // act2 kanban stagger
        const lp2 = clamp((p - 0.34) / 0.24)
        kans.forEach((el, i) => {
          const th = i * (0.75 / kans.length)
          const t = clamp((lp2 - th) / 0.18)
          el.style.opacity = String(t)
          el.style.transform = `translateY(${(1 - t) * 14}px) scale(${0.96 + 0.04 * t})`
        })

        // act3 commits + AI type + toast
        const lp3 = clamp((p - 0.66) / 0.3)
        commits.forEach((el, i) => {
          const th = i * 0.13
          const t = clamp((lp3 - th) / 0.14)
          el.style.opacity = String(t)
          el.style.transform = `translateX(${(1 - t) * 16}px)`
        })
        if (sumEl) {
          const st = clamp((lp3 - 0.42) / 0.4)
          const n = Math.floor(st * summaryText.length)
          sumEl.textContent = summaryText.slice(0, n)
        }
        if (toast) {
          const on = lp3 > 0.9
          toast.style.opacity = on ? "1" : "0"
          toast.style.transform = on ? "none" : "translateX(24px)"
        }
      }

      const onScroll = () => {
        if (!ticking) {
          ticking = true
          requestAnimationFrame(render)
        }
      }
      const onResize = () => render()
      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onResize)
      render()
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll)
        window.removeEventListener("resize", onResize)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [rootRef, summaryText])
}
