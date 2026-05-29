import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Lightbulb,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/shared/lib/i18n";
import type { SlashCommandItem } from "../commands";

const ICONS: Record<string, LucideIcon> = {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  List,
  ListOrdered,
  ChevronRight,
  Quote,
  Lightbulb,
  Table: TableIcon,
  Minus,
};

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

// cubic-bezier(0.4, 0, 0.2, 1) 비슷한 easeOutCubic — Material 부드러움
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * 커스텀 부드러운 스크롤 — wraparound 같은 큰 점프를 명시적 easing으로 보간.
 * token으로 중간 cancel 가능 (화살표 연타 시 이전 애니메이션 중단).
 */
function animateScrollTo(
  el: HTMLElement,
  targetTop: number,
  durationMs: number,
  token: { cancelled: boolean },
) {
  const startTop = el.scrollTop;
  const delta = targetTop - startTop;
  if (delta === 0) return;
  const startTime = performance.now();
  const step = (now: number) => {
    if (token.cancelled) return;
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / durationMs);
    el.scrollTop = startTop + delta * easeOutCubic(t);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * 슬래시 메뉴 — 키보드(↑↓ + Enter, Esc) 및 마우스 선택 지원.
 */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  function SlashMenu({ items, command }, ref) {
    const { locale } = useTranslation();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
    // 진행 중인 scroll 애니메이션 토큰 — 새 호출 시 이전 것 취소
    const scrollTokenRef = useRef<{ cancelled: boolean } | null>(null);

    // 아이템이 바뀌면 첫 번째 선택
    useEffect(() => setSelectedIndex(0), [items]);

    // 선택 변경 시 해당 항목이 viewport 안에 들어오도록 스크롤
    //  · 작은 이동(viewport의 절반 미만)  → 브라우저 native scrollTo({ smooth })
    //  · 큰 점프(wraparound 등)         → 커스텀 rAF + easeOutCubic 으로 280ms 보간
    //  → 끊김 없이 일관된 부드러움
    useEffect(() => {
      const el = itemRefs.current[selectedIndex];
      const container = containerRef.current;
      if (!el || !container) return;

      const raf = requestAnimationFrame(() => {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const margin = 8;

        // 항목이 viewport 안에 있고 가장자리에서 충분히 떨어져 있으면 스크롤 안 함
        const isVisible =
          elRect.top >= containerRect.top + margin &&
          elRect.bottom <= containerRect.bottom - margin;
        if (isVisible) return;

        // 목표 scrollTop 계산
        let targetTop = container.scrollTop;
        if (elRect.top < containerRect.top + margin) {
          targetTop -= containerRect.top + margin - elRect.top;
        } else {
          targetTop += elRect.bottom - containerRect.bottom + margin;
        }
        const maxScroll = container.scrollHeight - container.clientHeight;
        targetTop = Math.max(0, Math.min(targetTop, maxScroll));

        const distance = Math.abs(targetTop - container.scrollTop);

        // 이전 커스텀 애니메이션이 진행 중이면 취소
        if (scrollTokenRef.current) {
          scrollTokenRef.current.cancelled = true;
        }

        // 큰 점프(viewport 절반 이상)는 커스텀 easing 으로
        if (distance > containerRect.height / 2) {
          const token = { cancelled: false };
          scrollTokenRef.current = token;
          animateScrollTo(container, targetTop, 280, token);
        } else {
          // 일반 이동은 브라우저 native smooth scroll
          container.scrollTo({ top: targetTop, behavior: "smooth" });
        }
      });
      return () => cancelAnimationFrame(raf);
    }, [selectedIndex]);

    // 언마운트 시 진행 중 애니메이션 정리
    useEffect(() => {
      return () => {
        if (scrollTokenRef.current) scrollTokenRef.current.cancelled = true;
      };
    }, []);

    const grouped = useMemo(() => {
      const byCategory: Record<string, SlashCommandItem[]> = {};
      items.forEach((item) => {
        if (!byCategory[item.category]) byCategory[item.category] = [];
        byCategory[item.category].push(item);
      });
      return byCategory;
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          const target = items[selectedIndex];
          if (target) command(target);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="slash-menu">
          <div className="slash-menu-empty">검색 결과 없음</div>
        </div>
      );
    }

    const categoryLabels: Record<string, { ko: string; en: string }> = {
      heading: { ko: "제목", en: "Headings" },
      list: { ko: "목록", en: "Lists" },
      block: { ko: "블록", en: "Blocks" },
      media: { ko: "미디어", en: "Media" },
    };

    let flatIndex = -1;
    // ref 배열 길이 조정
    itemRefs.current.length = items.length;
    return (
      <div ref={containerRef} className="slash-menu">
        {Object.entries(grouped).map(([category, list]) => (
          <div key={category} className="slash-menu-group">
            <div className="slash-menu-group-label">
              {categoryLabels[category]?.[locale === "ko" ? "ko" : "en"] ??
                category}
            </div>
            {list.map((item) => {
              flatIndex += 1;
              const Icon = ICONS[item.icon] ?? Minus;
              const isActive = flatIndex === selectedIndex;
              const myIndex = flatIndex;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[myIndex] = el;
                  }}
                  type="button"
                  className="slash-menu-item"
                  data-active={isActive ? "true" : undefined}
                  onMouseEnter={() => {
                    // 마우스 호버 시 선택 인덱스 갱신
                    let idx = -1;
                    items.forEach((it, i) => {
                      if (it.id === item.id) idx = i;
                    });
                    if (idx >= 0) setSelectedIndex(idx);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    command(item);
                  }}
                >
                  <span className="slash-menu-icon">
                    <Icon size={16} />
                  </span>
                  <span className="slash-menu-body">
                    <span className="slash-menu-title">
                      {locale === "ko" ? item.titleKo : item.titleEn}
                    </span>
                    <span className="slash-menu-desc">
                      {locale === "ko" ? item.descKo : item.descEn}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
);
