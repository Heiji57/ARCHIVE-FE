import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "@/shared/lib/i18n";
import type { SlashCommandItem, SlashMenuRef } from "../../model/types";
import { CATEGORY_LABELS, FallbackIcon, ICONS } from "./constants";
import { useSlashMenuScroll } from "./useSlashMenuScroll";

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
    useSlashMenuScroll(selectedIndex, containerRef, itemRefs);

    // 아이템이 바뀌면 첫 번째 선택
    useEffect(() => setSelectedIndex(0), [items]);

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

    let flatIndex = -1;
    // 렌더할 항목 수에 맞춰 ref 배열 길이를 맞춘다(스크롤-인투-뷰용 el 저장소).
    // 렌더 중 조정이 필요한 escape hatch라 refs 규칙을 예외 처리한다.
    // eslint-disable-next-line react-hooks/refs
    itemRefs.current.length = items.length;
    return (
      <div ref={containerRef} className="slash-menu">
        {Object.entries(grouped).map(([category, list]) => (
          <div key={category} className="slash-menu-group">
            <div className="slash-menu-group-label">
              {CATEGORY_LABELS[category]?.[locale === "ko" ? "ko" : "en"] ??
                category}
            </div>
            {list.map((item) => {
              flatIndex += 1;
              const Icon = ICONS[item.icon] ?? FallbackIcon;
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
