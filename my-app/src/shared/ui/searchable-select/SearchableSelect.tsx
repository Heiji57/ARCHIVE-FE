import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** 선택값이 없을 때 트리거에 표시 */
  placeholder?: string;
  /** 검색 입력 placeholder */
  searchPlaceholder?: string;
  /** 일치 결과 없음 텍스트 */
  emptyText?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

interface PanelRect {
  left: number;
  top: number;
  width: number;
  /** 트리거 위로 펼칠지 (아래 공간 부족 시) */
  openUp: boolean;
  maxHeight: number;
}

const PANEL_MAX = 320;

/**
 * 검색 가능한 select (콤보박스).
 *  - 키보드: 입력 즉시 필터, ↑/↓ 이동, Enter 선택, Esc 닫기.
 *  - 긴 목록(국가 249개·타임존 400+)을 빠르게 찾기 위해 네이티브 select 를 대체한다.
 *  - 드롭다운은 portal + fixed 좌표로 렌더해 카드 overflow 에 잘리지 않는다.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  id,
  className,
  disabled,
  ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<PanelRect | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // 패널이 실제로 마운트된 뒤 단 한 번만 검색창에 포커스하기 위한 가드.
  const focusedRef = useRef(false);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const computeRect = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    const openUp = below < Math.min(PANEL_MAX, 240) && above > below;
    const maxHeight = Math.min(PANEL_MAX, (openUp ? above : below) - 12);
    setRect({
      left: r.left,
      top: openUp ? r.top : r.bottom,
      width: r.width,
      openUp,
      maxHeight: Math.max(160, maxHeight),
    });
  }, []);

  // 열릴 때 위치 계산 + 검색창 포커스
  useLayoutEffect(() => {
    if (!open) return;
    computeRect();
    // 열릴 때 현재 선택값 위치로 active 초기화(외부 open 상태와 동기화).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(filtered.findIndex((o) => o.value === value));
  }, [open, computeRect]); // eslint-disable-line react-hooks/exhaustive-deps

  // 드롭다운은 rect 계산 후(다음 렌더)에야 portal 로 마운트되므로, open 토글 시점엔
  // input 이 아직 없어 focus 가 무시된다. rect 가 준비된 뒤 한 번만 포커스한다.
  useEffect(() => {
    if (!open) {
      focusedRef.current = false;
      return;
    }
    if (rect && !focusedRef.current) {
      focusedRef.current = true;
      inputRef.current?.focus();
    }
  }, [open, rect]);

  // 스크롤/리사이즈 시 위치 갱신 + 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => computeRect();
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [open, computeRect]);

  // 필터가 바뀌어 active 가 범위를 벗어나면 마지막 항목으로 보정.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active >= filtered.length) setActive(filtered.length - 1);
  }, [filtered.length, active]);

  // active 항목을 보이도록 스크롤
  useEffect(() => {
    if (!open || active < 0) return;
    const list = listRef.current;
    const node = list?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }, []);

  const choose = useCallback(
    (opt: SearchableSelectOption) => {
      onChange(opt.value);
      setOpen(false);
      setQuery("");
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) choose(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`ss-trigger ${className ?? "select"}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: selected
              ? "var(--color-ink)"
              : "var(--color-body-muted)",
          }}
        >
          {selected ? selected.label : placeholder ?? ""}
        </span>
        <ChevronDown
          size={15}
          style={{ flexShrink: 0, color: "var(--color-body-muted)" }}
        />
      </button>

      {open && rect
        ? createPortal(
            <>
              {/* 외부 클릭 감지용 오버레이 */}
              <div
                onClick={close}
                style={{ position: "fixed", inset: 0, zIndex: 1100 }}
              />
              <div
                role="listbox"
                style={{
                  position: "fixed",
                  left: rect.left,
                  width: rect.width,
                  ...(rect.openUp
                    ? { bottom: window.innerHeight - rect.top }
                    : { top: rect.top }),
                  zIndex: 1101,
                  marginTop: rect.openUp ? 0 : 4,
                  marginBottom: rect.openUp ? 4 : 0,
                  background: "var(--color-tile-1)",
                  border: "1px solid var(--color-divider-soft)",
                  borderRadius: "var(--r-md)",
                  boxShadow: "0 18px 48px rgba(0,0,0,0.45)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: rect.maxHeight,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderBottom: "1px solid var(--color-divider-soft)",
                  }}
                >
                  <Search
                    size={14}
                    style={{ flexShrink: 0, color: "var(--color-body-muted)" }}
                  />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActive(0);
                    }}
                    onKeyDown={onKeyDown}
                    placeholder={searchPlaceholder ?? ""}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--color-ink)",
                      fontSize: 16,
                    }}
                  />
                </div>

                <div
                  ref={listRef}
                  style={{ overflowY: "auto", padding: 4 }}
                >
                  {filtered.length === 0 ? (
                    <div
                      style={{
                        padding: "12px 10px",
                        fontSize: 16,
                        color: "var(--color-body-muted)",
                        textAlign: "center",
                      }}
                    >
                      {emptyText ?? "—"}
                    </div>
                  ) : (
                    filtered.map((opt, idx) => {
                      const isSel = opt.value === value;
                      const isActive = idx === active;
                      return (
                        <div
                          key={opt.value}
                          data-idx={idx}
                          role="option"
                          aria-selected={isSel}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => choose(opt)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "8px 10px",
                            fontSize: 16,
                            borderRadius: "var(--r-sm)",
                            cursor: "pointer",
                            color: "var(--color-ink)",
                            background: isActive
                              ? "var(--color-tile-3)"
                              : "transparent",
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {opt.label}
                          </span>
                          {isSel ? (
                            <Check
                              size={14}
                              style={{
                                flexShrink: 0,
                                color: "var(--color-primary)",
                              }}
                            />
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
