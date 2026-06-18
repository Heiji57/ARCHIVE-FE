/**
 * A.R.C.H.I.V.E 정식 채택 로고 — Glass Cabinet (단순화 isometric nav 마크).
 * design_handoff_archive/assets/logo-cabinet-nav.svg 와 동일. 앞면 탭만 액션 블루.
 */
export function CabinetMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 32"
      className={className}
      role="img"
      aria-hidden="true">
      <path d="M 22 4 L 33 9 L 33 19 L 22 14 Z" fill="#f5f5f7" opacity="0.5" />
      <path d="M 33 9 L 35 10 L 35 20 L 33 19 Z" fill="#f5f5f7" opacity="0.3" />
      <path
        d="M 16 9 L 27 14 L 27 23 L 16 18 Z"
        fill="#f5f5f7"
        opacity="0.72"
      />
      <path
        d="M 27 14 L 29 15 L 29 24 L 27 23 Z"
        fill="#f5f5f7"
        opacity="0.42"
      />
      <path d="M 10 14 L 21 19 L 21 28 L 10 23 Z" fill="#5e6ad2" />
      <path
        d="M 21 19 L 23 20 L 23 29 L 21 28 Z"
        fill="#5e6ad2"
        opacity="0.62"
      />
      <path d="M 4 21 L 15 26 L 15 31 L 4 26 Z" fill="#f5f5f7" opacity="0.32" />
      <path
        d="M 15 26 L 23 23 L 23 28 L 15 31 Z"
        fill="#f5f5f7"
        opacity="0.2"
      />
    </svg>
  )
}
