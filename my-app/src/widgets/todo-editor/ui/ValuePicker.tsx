import { useEffect, useId, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";

export interface PickerOption {
  key: string;
  /** 찾기에 쓰는 글자. */
  text: string;
  content: ReactNode;
  on?: boolean;
  /** 오른쪽 단축키 표시. 찾는 말이 없을 때 그 숫자를 누르면 바로 고른다. */
  kbd?: string;
  /** 찾는 말이 있어도 남긴다(입력한 날, 달력에서 고르기, 새로 만들기). */
  keep?: boolean;
  run(): void;
}

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/**
 * 값 옆 찾기 메뉴(26번 `.zm`): 위에 찾기 칸, 아래 목록, 바닥에 키 안내.
 * ↑↓ 로 고르고 Enter 로 바꾼다. Esc 는 모달의 cancel 에서 메뉴만 닫는다.
 */
export function ValuePicker({
  label,
  placeholder,
  options,
  className = "",
}: {
  label: string;
  placeholder: string;
  options: (query: string) => PickerOption[];
  className?: string;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const [query, setQuery] = useState("");
  const all = options(query);
  const nq = norm(query);
  const list = nq ? all.filter((o) => o.keep || norm(o.text).includes(nq)) : all;
  const [active, setActive] = useState(() => Math.max(0, all.findIndex((o) => o.on)));
  const cur = Math.min(active, Math.max(0, list.length - 1));

  useEffect(() => {
    document.getElementById(`${listId}-${cur}`)?.scrollIntoView({ block: "nearest" });
  }, [cur, listId]);

  return (
    <div className={`zm ${className}`} role="dialog" aria-label={label}>
      <input
        className="zm-in"
        autoFocus
        value={query}
        placeholder={placeholder}
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={list.length ? `${listId}-${cur}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const d = e.key === "ArrowDown" ? 1 : -1;
            setActive(Math.max(0, Math.min(list.length - 1, cur + d)));
            return;
          }
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            list[cur]?.run();
            return;
          }
          if (!query && /^[1-9]$/.test(e.key)) {
            const hit = list.find((o) => o.kbd === e.key);
            if (hit) {
              e.preventDefault();
              hit.run();
            }
          }
        }}
      />
      <div className="zm-l" id={listId} role="listbox" aria-label={label}>
        {list.length ? (
          list.map((o, i) => (
            <button
              key={o.key}
              type="button"
              role="option"
              id={`${listId}-${i}`}
              tabIndex={-1}
              aria-selected={i === cur}
              className={o.on ? "on" : undefined}
              onMouseMove={() => i !== cur && setActive(i)}
              onClick={() => o.run()}
            >
              <span>{o.content}</span>
              {o.on ? <Check size={14} strokeWidth={ICON_STROKE} aria-hidden /> : null}
              {o.kbd ? <kbd>{o.kbd}</kbd> : null}
            </button>
          ))
        ) : (
          <p className="zm-e">{t("todoEditor.menu.none")}</p>
        )}
      </div>
      <p className="zm-f">{t("todoEditor.menu.keys")}</p>
    </div>
  );
}
