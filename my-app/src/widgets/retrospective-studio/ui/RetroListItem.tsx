import { memo } from "react";
import type { JournalEntry } from "@/entities/entry/model/types";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";

export interface RetroListItemProps {
  entry: JournalEntry;
  isActive: boolean;
  isToday: boolean;
  onSelect: (id: string) => void;
  /** GitHub 동기화 상태 배지 표시 여부 — 개발자 계정만 true(일반 사용자는 숨김). */
  showSyncBadge: boolean;
}

function RetroListItemImpl({
  entry,
  isActive,
  isToday,
  onSelect,
  showSyncBadge,
}: RetroListItemProps) {
  const { t } = useTranslation();
  const isDraft = !entry.synced;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className="retro-list-item"
      data-active={isActive ? "true" : undefined}
    >
      <div className="retro-list-item-head">
        <p className="retro-list-item-title">{entry.title}</p>
        <span className="retro-list-item-date">{entry.dateKey}</span>
      </div>

      <div className="retro-list-item-badges">
        {isToday ? (
          <Pill tone="blue" className="pill-sm">
            {t("retro.badge.today")}
          </Pill>
        ) : null}
        {/* 동기화 상태 배지는 GitHub 연동이 가능한 개발자 계정에만 노출한다. */}
        {showSyncBadge ? (
          isDraft ? (
            <Pill tone="warn" className="pill-sm">
              {t("retro.badge.draft")}
            </Pill>
          ) : (
            <Pill tone="green" className="pill-sm">
              {t("retro.badge.synced")}
            </Pill>
          )
        ) : null}
      </div>
    </button>
  );
}

export const RetroListItem = memo(RetroListItemImpl);
