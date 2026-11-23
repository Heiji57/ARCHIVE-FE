/**
 * 화면 네 모서리에 인디고 빗금 장식 (bg=10 시안).
 * pointer-events: none, z-index: 0으로 콘텐츠 뒤에 위치.
 */

const SIZE = 160;
const GAP = 10;
const CLIP_ID = "hc-clip";

function buildHatchPath(): string {
  const lines: string[] = [];
  for (let i = -SIZE; i < SIZE * 2; i += GAP) {
    lines.push(`M${i} 0l${SIZE} ${SIZE}`);
  }
  return lines.join(" ");
}

const HATCH_D = buildHatchPath();

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const points =
    pos === "tl" ? `0,0 ${SIZE},0 0,${SIZE}` :
    pos === "tr" ? `0,0 ${SIZE},0 ${SIZE},${SIZE}` :
    pos === "bl" ? `0,0 0,${SIZE} ${SIZE},${SIZE}` :
    `${SIZE},0 0,${SIZE} ${SIZE},${SIZE}`;
  return (
    <svg
      className={`hatch-corner ${pos}`}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`${CLIP_ID}-${pos}`}>
          <polygon points={points} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${CLIP_ID}-${pos})`}>
        <path
          d={HATCH_D}
          fill="none"
          stroke="var(--primary-h, #7c6af5)"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

export function HatchCorners() {
  return (
    <div className="hatch-corners" aria-hidden="true">
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />
    </div>
  );
}
