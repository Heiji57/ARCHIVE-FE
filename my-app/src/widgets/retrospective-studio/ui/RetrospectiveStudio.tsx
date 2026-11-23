import { useEffect } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation } from "@/shared/lib/i18n";
import { ConfirmModal } from "@/shared/ui/confirm-modal/ConfirmModal";
import { TextField } from "@/shared/ui/text-field/TextField";
import { useRegisterPaletteCommand } from "@/widgets/global-search";
import { useRetroStudio } from "../model/retroStudio";
import { NewRetroDialog } from "./NewRetroDialog";
import { RetroEditor } from "./RetroEditor";
import { RetroGallery } from "./RetroGallery";
import { RetroRailView } from "./RetroRailView";
import { RetroToolbar } from "./RetroToolbar";
import { SummaryDialog } from "./SummaryDialog";

/** 셸 상단 도구 막대 슬롯: 오늘 + 제목(회고 / 주제). */
export function RetroTopbar() {
  const { t } = useTranslation();
  const s = useRetroStudio();
  return (
    <>
      <button type="button" className="sh-btn" title={t("retro.top.todayTitle")} onClick={s.goToday}>
        {t("retro.top.today")}
      </button>
      <h1 className="sh-title">{t(s.area === "topic" ? "retro.top.topic" : "retro.top.retro")}</h1>
    </>
  );
}

/**
 * 회고 영역 본문(셸 main 자리): 목록(카드 / 넘기기) 또는 편집기, 그리고 새 회고 창, 요약 만들기 창, 폴더 창.
 * 주제 영역(area "topic")은 페이지가 TopicStudio 를 그린다. 새 회고 창과 폴더 창은 두 영역 모두에서 뜬다.
 */
export function RetrospectiveStudio() {
  const s = useRetroStudio();
  const { state, focusTarget, clearFocus } = useArchiveApp();
  const editing = s.area === "retro" && s.params.view === "editor" && s.params.entryId ? state.entries.find((e) => e.id === s.params.entryId) : undefined;

  // 명령 팔레트: 오늘 회고 쓰기(시안 순서 50)
  useRegisterPaletteCommand({
    id: "retro.today",
    labelKey: "retro.cmd.today",
    order: 50,
    run: () => {
      const has = state.entries.find((e) => e.retroType === "daily" && e.dateKey === s.today);
      if (has) s.openEntry(has.id);
      else s.openNew(s.today);
    },
  });

  // 전역 검색에서 고른 회고 열기
  useEffect(() => {
    if (focusTarget?.kind !== "entry") return;
    s.openEntry(focusTarget.entryId);
    clearFocus();
  }, [focusTarget, clearFocus, s]);

  // N 으로 새 회고(입력 중이 아니고 열린 창이 없을 때)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']") || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      s.openNew();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s]);

  return (
    <>
      {s.area === "retro" ? (
        editing ? (
          <RetroEditor key={editing.id} entry={editing} />
        ) : state.entries.length === 0 && s.list.all.length === 0 && !s.list.loading && !s.list.error ? (
          <RetroFirst />
        ) : (
          <div className={`rv-l1${s.vm === "rail" ? " vm-rail" : ""}`}>
            <div className="rv-pg">
              <RetroToolbar />
              {s.vm === "rail" ? <RetroRailView /> : <RetroGallery />}
            </div>
          </div>
        )
      ) : null}
      <RetroDialogs />
    </>
  );
}

/** 회고가 하나도 없을 때(시안 rest.js 빈 화면): 가운데 조용한 한 줄과 첫 회고 쓰기. */
function RetroFirst() {
  const { t } = useTranslation();
  const s = useRetroStudio();
  return (
    <div className="rv-first">
      <div className="rv-e1">
        <h2>{t("retro.first.title")}</h2>
        <p>{t("retro.first.desc")}</p>
        <button type="button" className="rv-p" onClick={() => s.openNew()}>
          {t("retro.first.button")}
        </button>
      </div>
    </div>
  );
}

function RetroDialogs() {
  const { t } = useTranslation();
  const s = useRetroStudio();
  const { createFolder, updateFolder, deleteFolder } = useArchiveApp();
  const fp = s.folderPrompt;

  const submitFolder = async () => {
    if (!fp) return;
    const name = fp.name.trim();
    if (!name) return;
    s.setFolderPrompt(null);
    if (fp.mode === "create") await createFolder(name, fp.parentId ?? null);
    else if (fp.folderId) await updateFolder(fp.folderId, { name });
    s.setFolderOpen(true);
    s.refreshFolders();
  };

  return (
    <>
      {s.newDialog ? <NewRetroDialog date={s.newDialog.date} /> : null}
      {s.summaryKind ? <SummaryDialog initialKind={s.summaryKind} /> : null}
      {fp ? (
        <ConfirmModal
          open
          title={fp.mode === "create" ? t("folder.newFolder") : t("folder.rename")}
          message={
            <TextField
              autoFocus
              value={fp.name}
              placeholder={t("folder.namePlaceholder")}
              onChange={(e) => s.setFolderPrompt({ ...fp, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitFolder();
              }}
            />
          }
          confirmLabel={t("common.confirm")}
          cancelLabel={t("common.cancel")}
          onConfirm={() => void submitFolder()}
          onCancel={() => s.setFolderPrompt(null)}
        />
      ) : null}
      {s.folderDelete ? (
        <ConfirmModal
          open
          tone="danger"
          title={t("folder.deleteTitle")}
          message={<span style={{ whiteSpace: "pre-line" }}>{t("folder.deleteMessage")}</span>}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={() => {
            const f = s.folderDelete;
            s.setFolderDelete(null);
            if (!f) return;
            if (s.folder === f.id) s.setFolder("all");
            void deleteFolder(f.id).then(() => s.refreshFolders());
          }}
          onCancel={() => s.setFolderDelete(null)}
        />
      ) : null}
    </>
  );
}
