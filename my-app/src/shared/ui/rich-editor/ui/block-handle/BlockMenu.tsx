import { ChevronRight, Copy, Minus, Trash2, Type } from "lucide-react";
import { TURN_INTO_OPTIONS, type TurnIntoOption } from "./turnIntoOptions";

interface BlockMenuProps {
  left: number;
  top: number;
  turnIntoOpen: boolean;
  onToggleTurnInto: () => void;
  onTurnInto: (option: TurnIntoOption) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  cancelHide: () => void;
  scheduleHide: () => void;
}

/**
 * 블록 핸들 메뉴 — 전환(서브메뉴) / 복제 / 삭제.
 */
export function BlockMenu({
  left,
  top,
  turnIntoOpen,
  onToggleTurnInto,
  onTurnInto,
  onDuplicate,
  onDelete,
  cancelHide,
  scheduleHide,
}: BlockMenuProps) {
  return (
    <div
      className="rich-block-menu"
      style={{ position: "fixed", left, top, transform: "translateX(-100%)" }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={cancelHide}
      onMouseLeave={() => scheduleHide()}
    >
      {/* 전환 (sub-menu) */}
      <button
        type="button"
        className="rich-block-menu-item rich-block-menu-item-with-arrow"
        onClick={onToggleTurnInto}
      >
        <Type size={13} />
        <span>전환</span>
        <ChevronRight size={12} className="rich-block-menu-arrow" />
      </button>
      {turnIntoOpen ? (
        <div className="rich-block-menu rich-block-menu-sub">
          {TURN_INTO_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                className="rich-block-menu-item"
                onClick={() => onTurnInto(opt)}
              >
                <Icon size={13} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        className="rich-block-menu-item"
        onClick={onDuplicate}
      >
        <Copy size={13} />
        <span>
          복제 <kbd className="rich-block-kbd">Ctrl+D</kbd>
        </span>
      </button>
      <button
        type="button"
        className="rich-block-menu-item rich-block-menu-item-danger"
        onClick={onDelete}
      >
        <Trash2 size={13} />
        <span>
          삭제 <kbd className="rich-block-kbd">Del</kbd>
        </span>
      </button>
      <div className="rich-block-menu-divider" />
      <div className="rich-block-menu-hint">
        <Minus size={10} /> 색 지정은 곧 추가 예정
      </div>
    </div>
  );
}
