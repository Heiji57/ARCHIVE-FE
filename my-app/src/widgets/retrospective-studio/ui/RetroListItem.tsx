import { memo } from "react";
import type { JournalEntry } from "@/entities/entry/model/types";
import { Pill } from "@/shared/ui/pill/Pill";
import { useTranslation } from "@/shared/lib/i18n";

export interface RetroListItemProps {
  entry: JournalEntry;
  isActive: boolean;
  isToday: boolean;
  onSelect: (id: string) => void;
}

function RetroListItemImpl({
  entry,
  isActive,
  isToday,
  onSelect,
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
        {isDraft ? (
          <Pill tone="warn" className="pill-sm">
            {t("retro.badge.draft")}
          </Pill>
        ) : (
          <Pill tone="green" className="pill-sm">
            {t("retro.badge.synced")}
          </Pill>
        )}
      </div>
    </button>
  );
}

export const RetroListItem = memo(RetroListItemImpl);
