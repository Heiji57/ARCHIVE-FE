import type { ReactNode } from "react";

/**
 * 행 기반 설정 항목: 왼쪽 라벨(+설명) / 오른쪽 컨트롤.
 * `.settings-list` 컨테이너 안에서 행 사이에 구분선이 자동으로 그려진다.
 *
 * 컨트롤이 넓어(예: 검색 가능한 select) 한 줄에 함께 두기 어려우면
 * `stacked` 로 라벨 아래 전체폭으로 떨어뜨린다.
 */
export interface SettingRowProps {
  label: string;
  description?: string;
  /** label 을 <label htmlFor> 로 렌더해 컨트롤과 연결할 때 */
  htmlFor?: string;
  children: ReactNode;
  stacked?: boolean;
}

export function SettingRow({
  label,
  description,
  htmlFor,
  children,
  stacked,
}: SettingRowProps) {
  return (
    <div className={`setting-row${stacked ? " setting-row--stacked" : ""}`}>
      <div className="setting-row-text">
        {htmlFor ? (
          <label className="setting-row-label" htmlFor={htmlFor}>
            {label}
          </label>
        ) : (
          <span className="setting-row-label">{label}</span>
        )}
        {description ? <p className="setting-row-desc">{description}</p> : null}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}
