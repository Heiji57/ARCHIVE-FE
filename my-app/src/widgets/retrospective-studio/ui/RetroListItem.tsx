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
      style={{
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: "var(--r-md)",
        background: isActive ? "var(--color-ink)" : "var(--color-tile-2)",
        color: isActive ? "var(--color-canvas)" : "var(--color-ink)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.14px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {entry.title}
        </p>
        <span
          style={{
            fontSize: 10,
            color: isActive
              ? "var(--color-ink-muted-48)"
              : "var(--color-body-muted)",
            flexShrink: 0,
          }}
        >
          {entry.dateKey}
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {isToday ? (
          <Pill tone="blue" style={{ fontSize: 10, padding: "3px 8px" }}>
            {t("retro.badge.today")}
          </Pill>
        ) : null}
        {isDraft ? (
          <Pill tone="warn" style={{ fontSize: 10, padding: "3px 8px" }}>
            {t("retro.badge.draft")}
          </Pill>
        ) : (
          <Pill tone="green" style={{ fontSize: 10, padding: "3px 8px" }}>
            {t("retro.badge.synced")}
          </Pill>
        )}
      </div>
    </button>
  );
}

export const RetroListItem = memo(RetroListItemImpl);
