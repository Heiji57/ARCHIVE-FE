import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import type { RecurrenceScope } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";

export interface RecurrenceScopeDialogProps {
  open: boolean;
  title: string;
  /** 표시할 범위 옵션(순서대로 렌더). */
  scopes: RecurrenceScope[];
  onChoose: (scope: RecurrenceScope) => void;
  onCancel: () => void;
}

const SCOPE_LABEL_KEY: Record<RecurrenceScope, "todo.recurrence.scope.this" | "todo.recurrence.scope.following" | "todo.recurrence.scope.all"> = {
  this: "todo.recurrence.scope.this",
  following: "todo.recurrence.scope.following",
  all: "todo.recurrence.scope.all",
};

/**
 * 반복 시리즈 수정/삭제 전 범위(this/following/all)를 고르는 확인 다이얼로그.
 * ConfirmModal 과 같은 portal + 오버레이 + Esc 닫기 패턴을 따르되, 단일 확인 버튼
 * 대신 범위별 선택지를 세로로 나열한다.
 */
export function RecurrenceScopeDialog({
  open,
  title,
  scopes,
  onChoose,
  onCancel,
}: RecurrenceScopeDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
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
          maxWidth: 380,
          background: "var(--color-tile-1)",
          border: "1px solid var(--color-divider-soft)",
          borderRadius: "var(--r-xl)",
          padding: "20px 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <h3
          style={{
            margin: "0 0 14px",
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 600,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {scopes.map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => onChoose(scope)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                padding: "12px 12px",
                borderRadius: "var(--r-md)",
                background: "var(--color-tile-3)",
                border: "1px solid var(--color-divider-soft)",
                color: "var(--color-ink)",
                fontSize: 16,
              }}
            >
              {t(SCOPE_LABEL_KEY[scope])}
              <ChevronRight size={14} style={{ color: "var(--color-body-muted)" }} />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-utility"
          onClick={onCancel}
          style={{ width: "100%", marginTop: 12, padding: "9px 16px" }}
        >
          {t("todo.recurrence.scope.cancel")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
