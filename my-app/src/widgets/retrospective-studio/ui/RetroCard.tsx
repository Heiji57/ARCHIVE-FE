import { memo } from "react";
import { Folder as FolderIcon } from "lucide-react";
import type { JournalEntry } from "@/entities/entry/model/types";
import { useDraggable } from "@/shared/lib/dnd";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE, SparkIcon } from "@/shared/ui/icons";
import { RETRO_DRAG_KIND, type RetroDragPayload } from "../model/constants";
import { KIND_KEY, monthParts, retroTitle, weekdayLong } from "../model/format";
import { useEntryState } from "../model/entryState";
import { cardHead, plainExcerpt } from "../model/retroList";

/** 카드와 넘기기 머리의 큰 날짜(시안 dateCol). */
export function DateInk({ entry }: { entry: Pick<JournalEntry, "retroType" | "dateKey"> }) {
  const { t, locale } = useTranslation();
  const h = cardHead(entry);
  switch (h.kind) {
    case "range":
      return (
        <>
          <b className="s">{h.start}</b>
          <small>~ {h.end}</small>
        </>
      );
    case "month": {
      const m = monthParts(locale, h.month);
      return (
        <>
          <b>
            {m.n}
            {m.unit ? <i>{m.unit}</i> : null}
          </b>
          <small>{h.year}</small>
        </>
      );
    }
    case "year":
      return (
        <>
          <b className="s">{h.year}</b>
          <small>{t("retro.cd.wholeYear")}</small>
        </>
      );
    default:
      return (
        <>
          <b>{h.day}</b>
          <small>{weekdayLong(locale, h.dateKey)}</small>
        </>
      );
  }
}

export interface RetroCardProps {
  entry: JournalEntry;
  folderName: string;
  current?: boolean;
  onOpen: (id: string) => void;
}

function RetroCardImpl({ entry, folderName, current, onOpen }: RetroCardProps) {
  const { t, locale } = useTranslation();
  const { pending, failed, empty } = useEntryState(entry);
  const { isDragging, ...drag } = useDraggable({
    kind: RETRO_DRAG_KIND,
    data: { itemType: "entry", id: entry.id, retroType: entry.retroType } satisfies RetroDragPayload,
  });
  const ex = empty ? t("retro.cd.empty") : pending ? t("retro.cd.pending") : failed ? t("retro.cd.failed") : plainExcerpt(entry.content);
  return (
    <button
      type="button"
      className={`rv-cd k-${entry.retroType}${empty ? " today" : ""}`}
      data-state={pending ? "pending" : failed ? "failed" : undefined}
      data-dragging={isDragging ? "true" : undefined}
      aria-current={current ? "true" : undefined}
      onClick={() => onOpen(entry.id)}
      {...drag}
    >
      <span className="q-top">
        <span className="q-num">
          <DateInk entry={entry} />
        </span>
      </span>
      <span className="mt">
        <span className="q-ty">
          {entry.isSummary ? <SparkIcon size={11} /> : null}
          {t(KIND_KEY[entry.retroType])}
        </span>
        <span className="sp" />
        {pending ? <span className="q-st">{t("retro.cd.stPending")}</span> : null}
        {failed ? <span className="q-st f">{t("retro.cd.stFailed")}</span> : null}
        {empty ? <span className="q-st t">{t("retro.cd.stDraft")}</span> : null}
      </span>
      <span className="tt">{retroTitle(t, locale, entry)}</span>
      <span className="ex">{ex}</span>
      <span className="ft">
        <FolderIcon size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
        {folderName}
      </span>
    </button>
  );
}

export const RetroCard = memo(RetroCardImpl);
