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


/**
 * 슬래시 메뉴 — 키보드(↑↓ + Enter, Esc) 및 마우스 선택 지원.
 */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  function SlashMenu({ items, command }, ref) {
    const { locale } = useTranslation();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
    // 이전 선택 인덱스 — wraparound/마우스 점프 감지용
    const prevIndexRef = useRef(selectedIndex);

    // 아이템이 바뀌면 첫 번째 선택
    useEffect(() => setSelectedIndex(0), [items]);

    // 선택 변경 시: 선택된 항목을 viewport 가운데로 스크롤
    //  · 한 칸씩 이동(인접) → 부드러운 smooth scroll
    //  · 큰 점프(wraparound, 마우스 점프) → 즉시 (instant) 순간이동
    useEffect(() => {
      const el = itemRefs.current[selectedIndex];
      const container = containerRef.current;
      const prev = prevIndexRef.current;
      prevIndexRef.current = selectedIndex;
      if (!el || !container) return;

      const isJump = Math.abs(selectedIndex - prev) > 1;

      const raf = requestAnimationFrame(() => {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 항목의 컨테이너 내부 top (scroll 무관 절대 위치)
        const elTopInContainer =
          elRect.top - containerRect.top + container.scrollTop;
        // 항목 중심이 viewport 중심에 오는 scrollTop
        const targetTop =
          elTopInContainer - (containerRect.height - elRect.height) / 2;

        const maxScroll = Math.max(
          0,
          container.scrollHeight - container.clientHeight,
        );
        const clampedTarget = Math.max(0, Math.min(targetTop, maxScroll));

        // 거의 변화 없으면 skip (불필요한 rerender 방지)
        if (Math.abs(clampedTarget - container.scrollTop) < 1) return;

        if (isJump) {
          // wraparound 또는 마우스 점프 → 명시적 instant (CSS 영향 무시)
          container.scrollTo({ top: clampedTarget, behavior: "auto" });
        } else {
          // 한 칸 이동 → 부드러운 가운데 정렬
          container.scrollTo({ top: clampedTarget, behavior: "smooth" });
        }
      });
      return () => cancelAnimationFrame(raf);
    }, [selectedIndex]);

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
                  onMouseDown={(e) => {
                    // 마우스 클릭은 selectedIndex와 무관 — 호버 항목을 직접 실행
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
