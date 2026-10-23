import type { ReactNode } from "react";

/**
 * 연동 카드 안의 on/off 설정 행: 왼쪽 라벨·설명(+부가 내용) / 오른쪽 작은 스위치.
 * `children` 은 설명 아래(데이터 방향 표시, 인라인 확인 등)에 붙는다.
 */
export interface ToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}

export function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
  children,
}: ToggleRowProps) {
  const labelId = `${id}-label`;
  return (
    <div className={`toggle-row${disabled ? " toggle-row--disabled" : ""}`}>
      <div className="toggle-row-text">
        <span id={labelId} className="setting-row-label">
          {label}
        </span>
        {description ? <p className="setting-row-desc">{description}</p> : null}
        {children}
      </div>
      <button
        type="button"
        id={id}
        className="setting-switch"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

/** 데이터가 어느 쪽에서 어느 쪽으로 가는지 보여주는 한 줄. 예) ARCHIVE → Google */
export function FlowTag({ from, to, label }: { from: string; to: string; label: string }) {
  return (
    <span className="flow-tag" role="note" aria-label={label}>
      <span aria-hidden="true">{from}</span>
      <span className="flow-tag-arrow" aria-hidden="true">→</span>
      <span aria-hidden="true">{to}</span>
    </span>
  );
}
