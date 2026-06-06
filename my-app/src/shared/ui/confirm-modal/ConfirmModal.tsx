import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** 확인(주요) 동작 */
  onConfirm: () => void;
  /** 취소(부차) 동작 */
  onCancel: () => void;
  /** 오버레이/Esc 로 닫을 때 호출 (없으면 onCancel) */
  onDismiss?: () => void;
  /** 취소 버튼 숨김 (단일 액션 알림용) */
  hideCancel?: boolean;
}

/** 범용 확인 모달 (Portal + 오버레이 + Esc 닫기). 다크 테마 인라인 스타일. */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onDismiss,
  hideCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (onDismiss ?? onCancel)();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel, onDismiss]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) (onDismiss ?? onCancel)();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--color-tile-1)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-xl)",
          padding: "24px 22px 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <h3
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--font-display)",
            fontSize: 19,
            fontWeight: 600,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        {message ? (
          <div
            style={{
              margin: "0 0 20px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--color-body-muted)",
            }}
          >
            {message}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          {hideCancel ? null : (
            <button
              type="button"
              className="btn btn-utility"
              onClick={onCancel}
              style={{ padding: "9px 16px" }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={{ padding: "9px 18px" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
