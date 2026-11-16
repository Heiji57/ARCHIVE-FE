import type { ReactNode, SVGProps } from "react";

/**
 * 리디자인 아이콘. 시안 `prototypes/linear-shell/shared/shared.js` 의 `A.ico` 중
 * lucide-react 에 같은 모양이 없는 것만 여기 만든다. 나머지는 lucide 를 쓴다:
 *
 * | 시안 A.ico | 쓸 것                          |
 * |-----------|--------------------------------|
 * | cal       | lucide `Calendar`              |
 * | dash      | lucide `LayoutDashboard`       |
 * | todo      | lucide `Check`                 |
 * | retro     | `RetroIcon` (여기)              |
 * | set       | `SettingsIcon` (여기)           |
 * | search    | lucide `Search`                |
 * | bell      | lucide `Bell`                  |
 * | gh        | `GithubIcon` (여기, lucide 1.x 는 브랜드 아이콘이 없다) |
 * | l / r     | lucide `ChevronLeft` / `ChevronRight` |
 * | x         | lucide `X`                     |
 * | mark      | lucide `Bookmark`              |
 * | link      | lucide `Link`                  |
 * | plus      | lucide `Plus`                  |
 * | inbox     | lucide `Inbox`                 |
 * | sparkle   | `SparkIcon` (여기, lucide `Sparkle` 은 곡선이라 모양이 다르다) |
 *
 * 시안의 `svg.i` 는 16px, 선 굵기 1.7 이다. lucide 를 쓸 때도 `size={16} strokeWidth={ICON_STROKE}` 로 맞춘다.
 * 새 아이콘은 이름 알파벳 순 자리에 넣는다(병렬 작업 merge 충돌 줄이기).
 */
export const ICON_STROKE = 1.7;

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
};

function Svg({ size = 16, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** 시안 `gh`: GitHub 고양이 윤곽. */
export function GithubIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.5-.5-2 3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.6 4.6 0 0 0-.1-3.5s-1.1-.3-3.5 1.4a12 12 0 0 0-6.2 0C6.9 2.7 5.8 3 5.8 3a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 4.3 10c0 5 3 6.2 6 6.5-.6.5-.6 1.2-.5 2V21" />
    </Svg>
  );
}

/** 시안 `retro`: 모서리가 둥근 회고 노트와 두 줄. */
export function RetroIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
      <path d="M8 9h8M8 13h5" />
    </Svg>
  );
}

/** 시안 `set`: 가운데 원과 여덟 갈래 선(설정). */
export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </Svg>
  );
}

/** 시안 `sparkle`: 직선 네 갈래 별(AI 표시). */
export function SparkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
    </Svg>
  );
}
