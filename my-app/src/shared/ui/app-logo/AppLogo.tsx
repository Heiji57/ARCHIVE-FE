import { useId, type SVGProps } from "react";

export type AppLogoProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
};

const WING = "M6.7 11.2C7.6 13 9.2 14.6 10.6 15.2 9.8 18.4 8.2 21 6.2 22.6 4 22.8 2 22.6 1 21.8 2.6 18 4.6 14.4 6.7 11.2Z";

/**
 * 앱 로고 표식(시안 39번 "둥근 날개", prototypes/linear-shell/shared/logo.js).
 * 꼭대기 물방울과 왼쪽 날개는 글자색(currentColor), 오른쪽 날개는 --primary-h → --primary 그라데이션.
 * 색은 CSS 변수 --lg-a, --lg-b, --lg-c 로 바꿀 수 있다. 랜딩의 ArchiveLogo 와는 별개.
 */
export function AppLogo({ size = 20, ...props }: AppLogoProps) {
  const gid = `lg39-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="7" y1="11" x2="2" y2="22">
          <stop stopColor="var(--lg-b, var(--primary-h))" />
          <stop offset="1" stopColor="var(--lg-c, var(--primary))" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.8C15 5 16.8 7.6 16.2 9.3 15.4 11.4 13.6 12.4 12 13 10.4 12.4 8.6 11.4 7.8 9.3 7.2 7.6 9 5 12 1.8Z"
        fill="var(--lg-a, currentColor)"
      />
      <path d={WING} fill={`url(#${gid})`} />
      <path d={WING} fill="var(--lg-a, currentColor)" transform="matrix(-1 0 0 1 24 0)" />
      <ellipse cx="12" cy="19" rx="1.9" ry="2.7" fill="var(--lg-b, var(--primary-h))" />
    </svg>
  );
}
