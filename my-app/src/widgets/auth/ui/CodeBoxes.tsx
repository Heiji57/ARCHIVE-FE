import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import { CODE_LENGTH, normalizeCode, putCode } from "../model/code";

/**
 * 인증 코드 6칸(시안 `.cd`). 값은 앞에서부터 이어진 한 문자열로 다룬다.
 * 붙여넣기와 자동 완성(one-time-code)은 칸을 차례로 채운다.
 */
export function CodeBoxes({
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const focusAt = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))];
    el?.focus();
    el?.select();
  };

  const put = (i: number, typed: string) => {
    const { next, focus } = putCode(value, i, typed);
    onChange(next);
    focusAt(focus);
  };

  const onInput = (i: number, raw: string) => {
    const prev = value[i] ?? "";
    let typed = normalizeCode(raw);
    // 이미 글자가 있는 칸에 새로 쳤을 때는 새 글자만
    if (prev && typed.length === 2 && typed.startsWith(prev)) typed = typed.slice(1);
    if (!typed) {
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }
    put(i, typed);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      onChange(value.slice(0, i - 1));
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight" && i < value.length) {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const typed = normalizeCode(e.clipboardData.getData("text"));
    if (!typed) return;
    e.preventDefault();
    put(i, typed);
  };

  return (
    <div className="auth-code" role="group" aria-label={t("auth.signup.code")}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          spellCheck={false}
          aria-label={t("auth.verify.box", { n: i + 1 })}
          value={value[i] ?? ""}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
        />
      ))}
    </div>
  );
}
