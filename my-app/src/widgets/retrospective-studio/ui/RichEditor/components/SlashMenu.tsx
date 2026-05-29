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

    // 아이템이 바뀌면 첫 번째 선택
    useEffect(() => setSelectedIndex(0), [items]);

    // 선택 변경 시 해당 항목이 컨테이너 viewport 안에 들어오도록 스크롤
    // (scrollIntoView 대신 scrollTop 직접 조작 — CSS scroll-behavior: smooth가
    //  부드럽게 처리. 화살표 연타 시 이전 애니메이션 잘림 없음)
    useEffect(() => {
      const el = itemRefs.current[selectedIndex];
      const container = containerRef.current;
      if (!el || !container) return;
      const raf = requestAnimationFrame(() => {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const margin = 6;
        if (elRect.top < containerRect.top + margin) {
          container.scrollTop -= containerRect.top + margin - elRect.top;
        } else if (elRect.bottom > containerRect.bottom - margin) {
          container.scrollTop += elRect.bottom - containerRect.bottom + margin;
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
