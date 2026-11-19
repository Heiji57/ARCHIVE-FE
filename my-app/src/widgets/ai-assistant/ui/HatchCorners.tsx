/**
 * 화면 네 모서리에 인디고 빗금 장식 (bg=10 시안).
 * pointer-events: none, z-index: 0으로 콘텐츠 뒤에 위치.
 */
export function HatchCorners() {
  const size = 160;
  // 대각선 빗금 경로 (gap=8, 범위 0~size)
  const lines: string[] = [];
  for (let i = -size; i < size * 2; i += 10) {
    lines.push(`M${i} 0l${size} ${size}`);
  }
  const d = lines.join(" ");
  const id = "hc-clip";

  const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => (
    <svg
      className={`hatch-corner ${pos}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`${id}-${pos}`}>
          {/* 모서리 삼각형 클리핑 */}
          <polygon points={`0,0 ${size},0 0,${size}`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-${pos})`}>
        <path
          d={d}
          fill="none"
          stroke="var(--primary-h, #7c6af5)"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </g>
    </svg>
  );

  return (
    <div className="hatch-corners" aria-hidden="true">
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />
    </div>
  );
}
