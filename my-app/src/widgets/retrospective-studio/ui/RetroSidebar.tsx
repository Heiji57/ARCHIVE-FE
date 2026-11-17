import { Bookmark, ChevronDown, Folder as FolderIcon, MoreHorizontal, Plus } from "lucide-react";
import type { FolderSummary } from "@/entities/folder/model/types";
import { useDraggable, useDropTarget } from "@/shared/lib/dnd";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE, RetroIcon } from "@/shared/ui/icons";
import { RETRO_DRAG_KIND, type RetroDragPayload } from "../model/constants";
import { useRetroStudio } from "../model/retroStudio";
import { PopMenu } from "./PopMenu";

const ic = { size: 14, strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

/** 회고 화면 사이드바(셸 sidebar 슬롯): 회고/주제, 폴더(접기, 새 폴더, 폴더별 거르기와 끌어 놓기). */
export function RetroSidebar() {
  const { t } = useTranslation();
  const s = useRetroStudio();

  // 폴더를 트리 순서(부모 → 자식)로 펼친다.
  const ordered: Array<{ f: FolderSummary; depth: number }> = [];
  const walk = (parent: string | null, depth: number) => {
    s.folders
      .filter((f) => f.parentFolderId === parent)
      .sort((a, b) => a.name.localeCompare(b.name, "en"))
      .forEach((f) => {
        ordered.push({ f, depth });
        if (depth < 6) walk(f.id, depth + 1);
      });
  };
  walk(null, 0);

  return (
    <>
      <section className="rv-side" aria-label={t("retro.side.section")}>
        <h2>{t("retro.side.section")}</h2>
        <button
          type="button"
          className="rv-ch"
          aria-pressed={s.area === "retro" && s.folder === "all"}
          onClick={() => {
            s.setFolder("all");
            s.navigate({});
          }}
        >
          <RetroIcon size={14} aria-hidden="true" />
          {t("retro.side.retros")}
          <span className="n">{s.retroCount}</span>
        </button>
        <button type="button" className="rv-ch" aria-pressed={s.area === "topic"} onClick={() => s.navigate({ area: "topic" })}>
          <Bookmark {...ic} />
          {t("retro.side.topics")}
          {s.topicCount !== null ? <span className="n">{s.topicCount}</span> : null}
        </button>
      </section>
      {s.area === "retro" ? (
        <section className="rv-side" aria-label={t("retro.side.folders")}>
          <h2 className="hx">
            <button type="button" className="rv-fold-t" aria-expanded={s.folderOpen} onClick={() => s.setFolderOpen(!s.folderOpen)}>
              {t("retro.side.folders")}
              <ChevronDown size={12} strokeWidth={ICON_STROKE} aria-hidden="true" className="cv" />
            </button>
            {s.folderOpen ? (
              <button
                type="button"
                className="rv-ib sm"
                aria-label={t("retro.side.newFolder")}
                title={t("retro.side.newFolder")}
                onClick={() => s.setFolderPrompt({ mode: "create", parentId: null, name: "" })}
              >
                <Plus size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
              </button>
            ) : null}
          </h2>
          {s.folderOpen ? (
            <>
              <button type="button" className="rv-ch" aria-pressed={s.folder === "all"} onClick={() => s.setFolder("all")}>
                <FolderIcon {...ic} />
                {t("retro.side.allFolders")}
              </button>
              {ordered.map(({ f, depth }) => (
                <FolderRow key={f.id} folder={f} depth={depth} />
              ))}
            </>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function FolderRow({ folder, depth }: { folder: FolderSummary; depth: number }) {
  const { t } = useTranslation();
  const s = useRetroStudio();
  const { isDragging, ...drag } = useDraggable({
    kind: RETRO_DRAG_KIND,
    data: { itemType: "folder", id: folder.id, name: folder.name } satisfies RetroDragPayload,
  });
  // 회고 카드를 놓으면 이 폴더로 옮기고, 다른 폴더를 놓으면 이 폴더 안으로 넣는다.
  const { ref, isOver, isActive } = useDropTarget<typeof RETRO_DRAG_KIND>(RETRO_DRAG_KIND, (payload) => {
    const d = payload.data as RetroDragPayload;
    if (d.itemType === "entry") s.moveEntry({ id: d.id, retroType: d.retroType }, folder.id);
    else if (d.id !== folder.id) s.nestFolder(d.id, folder.id);
  });
  const n = s.folderCount(folder.id);
  return (
    <div
      ref={ref}
      className="rv-frow"
      data-drop-over={isOver ? "true" : undefined}
      data-drop-active={isActive ? "true" : undefined}
      data-dragging={isDragging ? "true" : undefined}
      style={{ paddingLeft: depth * 12 }}
    >
      <button type="button" className="rv-ch" aria-pressed={s.folder === folder.id} onClick={() => s.setFolder(folder.id)} {...drag}>
        <FolderIcon {...ic} />
        <span className="nm">{folder.name}</span>
        {n !== null ? <span className="n">{n}</span> : null}
      </button>
      <PopMenu
        trigger={<MoreHorizontal size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />}
        triggerClass="rv-ib sm rv-fmore"
        triggerLabel={t("retro.side.folderMenu", { name: folder.name })}
        side="r"
      >
        {(close) => (
          <>
            <button type="button" role="menuitem" onClick={() => { close(); s.setFolderPrompt({ mode: "rename", folderId: folder.id, name: folder.name }); }}>
              {t("retro.side.rename")}
            </button>
            <button type="button" role="menuitem" onClick={() => { close(); s.setFolderPrompt({ mode: "create", parentId: folder.id, name: "" }); }}>
              {t("retro.side.newSub")}
            </button>
            <hr />
            <button type="button" role="menuitem" className="danger" onClick={() => { close(); s.setFolderDelete(folder); }}>
              {t("retro.side.delete")}
            </button>
          </>
        )}
      </PopMenu>
    </div>
  );
}
