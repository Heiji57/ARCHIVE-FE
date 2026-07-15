import { useId } from "react"

export interface ArchiveLogoProps {
  className?: string
}

/** A.R.C.H.I.V.E 서비스 로고 — 파비콘과 동일한 마크. */
export function ArchiveLogo({ className }: ArchiveLogoProps) {
  const uid = useId()
  const bgId = `archive-logo-bg-${uid}`
  const sheenId = `archive-logo-sheen-${uid}`
  const shadowId = `archive-logo-shadow-${uid}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="A.R.C.H.I.V.E">
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b62e8" />
          <stop offset="100%" stopColor="#a282e8" />
        </linearGradient>
        <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="15"
            floodColor="#3b62e8"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <rect x="16" y="16" width="480" height="480" rx="112" fill={`url(#${bgId})`} />
        <rect
          x="16"
          y="16"
          width="480"
          height="200"
          rx="112"
          fill={`url(#${sheenId})`}
          opacity="0.10"
        />

        <path
          d="M120 300 L120 262 Q120 248 134 248 L198 248 Q206 248 211 254 L228 274 L378 274 Q392 274 392 288 L392 356 Q392 380 368 380 L144 380 Q120 380 120 356 Z"
          fill="#ffffff"
          fillOpacity="0.30"
        />

        <g transform="rotate(-11 244 322)">
          <rect x="184" y="150" width="120" height="172" rx="16" fill="#ffffff" fillOpacity="0.38" />
        </g>
        <g transform="rotate(-2 264 322)">
          <rect x="204" y="140" width="120" height="182" rx="16" fill="#ffffff" fillOpacity="0.66" />
        </g>
        <g transform="rotate(7 275 324)">
          <rect x="212" y="132" width="126" height="192" rx="16" fill="#ffffff" />
          <rect x="232" y="160" width="78" height="11" rx="5.5" fill="#3b62e8" />
          <rect x="232" y="186" width="60" height="11" rx="5.5" fill="#3b62e8" fillOpacity="0.5" />
          <rect x="232" y="212" width="68" height="11" rx="5.5" fill="#3b62e8" fillOpacity="0.32" />
        </g>

        <path
          d="M120 322 Q120 306 136 306 L376 306 Q392 306 392 322 L392 356 Q392 380 368 380 L144 380 Q120 380 120 356 Z"
          fill="#ffffff"
        />
      </g>
    </svg>
  )
}
