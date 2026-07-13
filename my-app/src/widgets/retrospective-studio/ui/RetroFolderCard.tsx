import { useState } from "react";
import { Folder as FolderIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { Folder } from "@/entities/folder/model/types";
import { useDraggable, useDropTarget } from "@/shared/lib/dnd";
import { useTranslation } from "@/shared/lib/i18n";
import {
  RETRO_DRAG_KIND,
  type RetroDragPayload,
} from "../model/constants";

export interface RetroFolderCardProps {
  folder: Folder;
  onOpen: (folder: Folder) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  /** 회고록 카드를 이 폴더로 드롭 → 이동. */
  onDropEntry: (entryId: string, retroType: RetrospectiveType) => void;
  /** 다른 폴더 카드를 이 폴더로 드롭 → 그 폴더를 이 폴더 밑으로 중첩. */
  onDropFolder: (folderId: string) => void;
}

export function RetroFolderCard({
  folder,
  onOpen,
  onRename,
  onDelete,
  onDropEntry,
  onDropFolder,
}: RetroFolderCardProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  // 다른 폴더로 드래그해 중첩시킬 수 있게 한다.
  const { isDragging, ...dragHandlers } = useDraggable({
    kind: RETRO_DRAG_KIND,
    data: {
      itemType: "folder",
      id: folder.id,
      name: folder.name,
    } satisfies RetroDragPayload,
  });

  // 회고록 카드 또는 다른 폴더 카드의 drop target(같은 kind, payload.itemType 으로 구분).
  const { ref, isOver, isActive } = useDropTarget<typeof RETRO_DRAG_KIND>(
    RETRO_DRAG_KIND,
    (payload) => {
      const data = payload.data as RetroDragPayload;
      if (data.itemType === "entry") {
        onDropEntry(data.id, data.retroType);
      } else if (data.itemType === "folder" && data.id !== folder.id) {
        onDropFolder(data.id);
      }
    },
  );

  return (
    <div
      ref={ref}
      className="retro-card retro-folder-card"
      data-draggable="true"
      data-dragging={isDragging ? "true" : undefined}
      data-drop-active={isActive ? "true" : undefined}
      data-drop-over={isOver ? "true" : undefined}
      {...dragHandlers}
    >
      <button
        type="button"
        className="retro-folder-card-open"
        onClick={() => onOpen(folder)}
      >
        <span className="retro-card-top">
          <span className="retro-card-icon retro-folder-card-icon">
            <FolderIcon size={16} />
          </span>
        </span>
        <p className="retro-card-title">{folder.name}</p>
        <span
          className="retro-folder-card-meta"
          title={t("folder.card.summary", {
            folders: folder.folderCount,
            entries: folder.entryCount,
          })}
        >
          {folder.folderCount > 0 ? `${folder.folderCount} · ` : ""}
          {folder.entryCount}
        </span>
      </button>

      <div className="retro-gallery-pop retro-folder-card-menu">
        <button
          type="button"
          className="retro-folder-card-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label={t("folder.rename")}
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen ? (
          <>
            <div
              className="retro-gallery-pop-backdrop"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="retro-gallery-pop-panel retro-folder-card-menu-panel"
              role="menu"
            >
              <button
                type="button"
                className="retro-gallery-ai-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onRename(folder);
                }}
              >
                <Pencil size={12} /> {t("folder.rename")}
              </button>
              <button
                type="button"
                className="retro-gallery-ai-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(folder);
                }}
              >
                <Trash2 size={12} /> {t("common.delete")}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
