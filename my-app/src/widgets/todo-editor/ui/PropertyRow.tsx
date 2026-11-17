import type { ReactNode } from "react";

/**
 * 속성 한 줄(시안 26 `.z26-r`, 3 `.nw3-r`): 왼쪽 아이콘과 이름, 오른쪽 값 단추. 단추 아래에 찾기 메뉴가 붙는다.
 */
export function PropertyRow({
  prop,
  icon,
  label,
  value,
  emptyText,
  ariaValue,
  open,
  onToggle,
  menu,
}: {
  prop: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  emptyText: string;
  ariaValue: string;
  open: boolean;
  onToggle: () => void;
  menu?: ReactNode;
}) {
  const empty = value === "" || value === null || value === undefined;
  return (
    <div className="z26-r">
      <span className="z26-k">
        {icon}
        {label}
      </span>
      <span className="zm-a">
        <button
          type="button"
          className={`zpb z26-v${empty ? " emp" : ""}`}
          data-prop={prop}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${label}: ${ariaValue || emptyText}`}
          onClick={onToggle}
        >
          <span>{empty ? emptyText : value}</span>
        </button>
        {open ? menu : null}
      </span>
    </div>
  );
}
