import { useEffect, type CSSProperties, type RefObject } from "react"

/** stagger 지연을 `--rd` CSS 변수로 전달하는 인라인 스타일 헬퍼 */
export const revealDelay = (ms: number): CSSProperties =>
  ({ "--rd": `${ms}ms` }) as CSSProperties

/**
 * 스크롤 등장 애니메이션 훅.
 * 컨테이너(rootRef) 안의 모든 `.lp-reveal` 요소를 관찰해, 뷰포트에 들어오면
 * `is-visible` 클래스를 한 번 부여한다. stagger 지연은 각 요소의 `--rd` CSS 변수로 제어.
 *
 * 라이브러리 없이 IntersectionObserver만 사용. 스크롤 컨테이너가 `.lp-root`이므로
 * observer root 를 동일하게 지정해 내부 스크롤 좌표 기준으로 교차를 계산한다.
 */
export function useScrollReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const targets = Array.from(root.querySelectorAll<HTMLElement>(".lp-reveal"))
    if (targets.length === 0) return

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // reduced-motion 또는 미지원 환경 → 즉시 표시
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            obs.unobserve(entry.target)
          }
        }
      },
      { root, threshold: 0.15, rootMargin: "0px 0px -12% 0px" },
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootRef])
}
