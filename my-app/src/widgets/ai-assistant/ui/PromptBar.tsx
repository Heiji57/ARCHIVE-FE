import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@/shared/lib/i18n";

interface PromptBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/** 자동 높이 조절 텍스트 영역 + 보내기 버튼. */
export function PromptBar({ value, onChange, onSend, disabled, placeholder }: PromptBarProps) {
  const { t } = useTranslation();
  const taRef = useRef<HTMLTextAreaElement>(null);

  const grow = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(200, ta.scrollHeight + 2) + "px";
  }, []);

  useEffect(() => {
    grow();
  }, [value, grow]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="ag-bar">
      <textarea
        ref={taRef}
        rows={1}
        value={value}
        onChange={(e) => { onChange(e.target.value); grow(); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t("ai.home.placeholder")}
        aria-label={t("ai.home.placeholder")}
        disabled={disabled}
      />
      <button
        type="button"
        className="ag-send"
        aria-label={t("ai.send")}
        disabled={disabled || !value.trim()}
        onClick={onSend}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </button>
    </div>
  );
}
