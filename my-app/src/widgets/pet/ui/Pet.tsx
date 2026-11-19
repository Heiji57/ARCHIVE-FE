import { HATCH_PATH_NORMAL, HATCH_PATH_SMALL, EYE_LEFT, EYE_RIGHT } from "../model/petFrames";
import "./pet.css";

type PetState = "idle" | "think" | "done" | "sleep";

interface PetProps {
  size?: number;
  state?: PetState;
  /** 접근성 레이블. aria-hidden="true"로 숨길 때는 생략 가능. */
  "aria-hidden"?: boolean;
}

let _id = 0;

/**
 * 빗금이 (hx10) SVG 아바타.
 * 얼굴 전체에 대각선 빗금이 채워지고, 눈 두 개가 마스크로 투명하게 뚫린다.
 * prefers-reduced-motion 에서는 CSS 애니메이션이 꺼진다(pet.css).
 */
export function Pet({ size = 48, state = "idle", "aria-hidden": hidden }: PetProps) {
  const id = `pet-m-${++_id}`;
  const small = size < 40;
  const hatchPath = small ? HATCH_PATH_SMALL : HATCH_PATH_NORMAL;

  return (
    <svg
      className={`pet-svg hx hx10${state !== "idle" ? ` st-${state}` : ""}`}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden={hidden ? true : undefined}
      shapeRendering="crispEdges"
    >
      <defs>
        <mask id={id}>
          {/* 얼굴 흰색 — 여기가 보임 */}
          <rect className="hx-mw" x="4" y="4" width="40" height="40" rx="6" fill="white" />
          {/* 눈 검정 — 여기가 뚫림(투명) */}
          <rect
            x={EYE_LEFT.x}
            y={EYE_LEFT.y}
            width={EYE_LEFT.w}
            height={EYE_LEFT.h}
            rx={EYE_LEFT.rx}
            fill="black"
          />
          <rect
            x={EYE_RIGHT.x}
            y={EYE_RIGHT.y}
            width={EYE_RIGHT.w}
            height={EYE_RIGHT.h}
            rx={EYE_RIGHT.rx}
            fill="black"
          />
        </mask>
      </defs>

      {/* 빗금 + fill 애니메이션 — 마스크로 얼굴 모양 클리핑 */}
      <g mask={`url(#${id})`}>
        <path className="hx-h" d={hatchPath} />
        <rect className="hx-fill" x="4" y="4" width="40" height="40" />
      </g>
    </svg>
  );
}
