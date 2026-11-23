import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import { Pet } from "./Pet";
import "./pet-popover.css";

/** 현재 경로를 한국어 페이지 이름으로 변환. */
function usePageName(): string {
  const { t } = useTranslation();
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path.includes("calendar") || path === "/") return t("shell.tab.calendar");
  if (path.includes("todos")) return t("shell.tab.todos");
  if (path.includes("retro")) return t("shell.tab.retro");
  if (path.includes("ai")) return t("shell.tab.ai");
  return t("shell.tab.calendar");
}

/**
 * 빗금이 버튼 + 팝오버 카드.
 * - 오른쪽 아래 고정 위치
 * - Ctrl+/ 단축키로 열고 닫기
 * - prefers-reduced-motion 반영은 pet.css에서
 */
export function PetPopover() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [petState, setPetState] = useState<"idle" | "think" | "done" | "sleep">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pageName = usePageName();

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => {
    setOpen(false);
    btnRef.current?.focus();
  }, []);

  // Ctrl+/ 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && open) {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [toggle, close, open]);

  // 열리면 입력 포커스
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // 카드 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node) &&
        btnRef.current !== e.target
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, close]);

  const suggestions = [
    t("ai.hatch.sug1"),
    t("ai.hatch.sug2"),
    t("ai.hatch.sug3"),
  ];

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    setPetState("think");
    setInput("");
    // 데모: 짧은 지연 후 done
    setTimeout(() => setPetState("done"), 1600);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="pet-wrap" data-st={petState}>
      {/* 팝오버 카드 */}
      {open && (
        <div
          ref={cardRef}
          className="pet-card"
          role="dialog"
          aria-label={t("ai.hatch.dialog")}
          aria-modal="true"
        >
          <div className="pet-h">
            <b>빗금이</b>
            <small>{t("ai.hatch.page").replace("{page}", pageName)}</small>
            <button
              type="button"
              className="pet-tx"
              onClick={close}
              aria-label={t("ai.hatch.hide")}
            >
              {t("ai.hatch.hide")}
            </button>
            <button
              type="button"
              className="pet-x"
              onClick={close}
              aria-label={t("ai.hatch.close")}
            >
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="pet-th" aria-live="polite">
            {petState === "think" && (
              <article className="pet-t">
                <p className="pet-b">생각하는 중…</p>
              </article>
            )}
            {petState === "done" && (
              <article className="pet-t">
                <p className="pet-y">
                  할 일을 추가하거나 옮기고, 회고 초안을 쓸 수 있어요. AI 탭에서 더 자세히 볼 수 있어요.
                </p>
              </article>
            )}
          </div>

          <div className="pet-low">
            {petState === "idle" && (
              <div className="pet-qs">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setInput(sug)}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pet-in">
            <input
              ref={inputRef}
              id="pet-input"
              type="text"
              autoComplete="off"
              placeholder={t("ai.hatch.placeholder")}
              aria-label={t("ai.hatch.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="pet-go"
              onClick={handleSend}
              aria-label={t("ai.send")}
            >
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 빗금이 버튼 */}
      <button
        ref={btnRef}
        type="button"
        className="pet-btn"
        data-st={petState}
        onClick={toggle}
        aria-label={t("ai.hatch.label")}
        aria-expanded={open}
        title={t("ai.hatch.tip.ctrl")}
      >
        <Pet size={40} aria-hidden={true} state={petState} />
      </button>
    </div>
  );
}
