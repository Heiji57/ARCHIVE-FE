import { Folder as FolderIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useDnd } from "@/shared/lib/dnd";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { RETRO_DRAG_KIND, type RetroDragPayload } from "@/widgets/retrospective-studio/model/constants";

/** 회고록 카드/폴더 카드를 폴더로 드래그할 때 마우스를 따라다니는 고스트. */
export function RetroDragGhost() {
  const { state } = useDnd();
  const { state: appState } = useArchiveApp();

  if (!state.payload || !state.pointer) return null;
  if (state.payload.kind !== RETRO_DRAG_KIND) return null;

  const data = state.payload.data as RetroDragPayload;
  const { x, y } = state.pointer;
  const rect = state.dragRect;
  const ghostLeft = rect ? x - rect.offsetX : x + 14;
  const ghostTop = rect ? y - rect.offsetY : y - 10;

  if (data.itemType === "folder") {
    return createPortal(
      <div
        className="drag-ghost"
        style={{ left: ghostLeft, top: ghostTop, width: rect?.width, height: rect?.height }}
      >
        <p className="drag-ghost-title">
          <FolderIcon size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
          {data.name}
        </p>
      </div>,
      document.body,
    );
  }

  const entry = appState.entries.find((e) => e.id === data.id);
  if (!entry) return null;

  return createPortal(
    <div
      className="drag-ghost"
      style={{ left: ghostLeft, top: ghostTop, width: rect?.width, height: rect?.height }}
    >
      <p className="drag-ghost-title">{entry.title}</p>
      <div className="drag-ghost-meta">
        <span className="drag-ghost-date">{entry.dateKey}</span>
      </div>
    </div>,
    document.body,
  );
}
