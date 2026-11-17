import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { RetroRouteParams } from "@/app/router/navigation";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTodayKey } from "@/app/providers/useToday";
import type { FolderSummary } from "@/entities/folder/model/types";
import type { SummaryKind } from "@/entities/summary/model/types";
import { buildDemoTopics } from "@/entities/topic/model/demo";
import { USE_API } from "@/shared/api/config";
import { useTranslation } from "@/shared/lib/i18n";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";
import { defaultTitle } from "./format";
import { periodRange } from "./retroList";
import { useAllFolders } from "./useAllFolders";
import { RetroStudioCtx, type FolderPrompt, type RetroStudioValue, type RetroViewMode } from "./retroStudio";
import { useRetroList, type RetroKindFilter } from "./useRetroList";

const VM_KEY = "archive.retro.vm";
const readVm = (): RetroViewMode => {
  try {
    return localStorage.getItem(VM_KEY) === "rail" ? "rail" : "grid";
  } catch {
    return "grid";
  }
};

/** 주제 수(사이드바). 데모는 주제 데모 수, 실제 모드는 GET /topics 한 번. */
function useTopicCount(today: string): number | null {
  const { loadTopics, isDemo } = useArchiveApp();
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    loadTopics()
      .then((l) => alive && setN(l.length))
      .catch(() => alive && setN(null));
    return () => {
      alive = false;
    };
  }, [isDemo, loadTopics]);
  const demoN = useMemo(() => (isDemo ? buildDemoTopics(today).topics.length : null), [isDemo, today]);
  return isDemo ? demoN : n;
}

export function RetroStudioProvider({
  params,
  onNavigate,
  children,
}: {
  params?: RetroRouteParams;
  onNavigate?: (p: RetroRouteParams) => void;
  children: ReactNode;
}) {
  const app = useArchiveApp();
  const { state, isDemo, createDailyEntry, updateEntry, pushNotification } = app;
  const { t, locale } = useTranslation();
  const today = useTodayKey();
  const p = useMemo(() => params ?? {}, [params]);
  const area = p.area === "topic" ? "topic" : "retro";
  const navigate = useCallback((x: RetroRouteParams) => onNavigate?.(x), [onNavigate]);

  const [type, setTypeRaw] = useState<RetroKindFilter>("all");
  const [period, setPeriodRaw] = useState({ year: today.slice(0, 4), month: "all", week: "all" });
  const [qRaw, setQRaw] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [folder, setFolderRaw] = useState("all");
  const [folderOpen, setFolderOpen] = useState(false);
  const [vm, setVmRaw] = useState<RetroViewMode>(readVm);
  const [railJump, setRailJump] = useState<string | null>(null);
  const [newDialog, setNewDialog] = useState<{ date: string } | null>(null);
  const [summaryKind, setSummaryKind] = useState<SummaryKind | null>(null);
  const [folderPrompt, setFolderPrompt] = useState<FolderPrompt | null>(null);
  const [folderDelete, setFolderDelete] = useState<FolderSummary | null>(null);

  const q = useDebouncedValue(qRaw, 250);
  const range = useMemo(() => periodRange(period.year, period.month, period.week), [period]);
  const list = useRetroList({ type, folder, q: q.trim(), range });
  const allFolders = useAllFolders(state.folders, true);
  const topicCount = useTopicCount(today);

  const toast = useCallback((title: string) => pushNotification("success", title, "", { transient: true }), [pushNotification]);

  const setVm = (v: RetroViewMode) => {
    setVmRaw(v);
    try {
      localStorage.setItem(VM_KEY, v);
    } catch {
      /* 저장 못 해도 화면은 동작 */
    }
  };

  const local = list.serverMode !== true;
  const folderName = useCallback(
    (id: string | null) => (id ? allFolders.folders.find((f) => f.id === id)?.name ?? t("retro.cd.unfiled") : t("retro.cd.unfiled")),
    [allFolders.folders, t],
  );
  const folderCount = useCallback(
    (id: string) =>
      local ? state.entries.filter((e) => e.folderId === id).length : state.folders.find((f) => f.id === id)?.entryCount ?? null,
    [local, state.entries, state.folders],
  );

  const value: RetroStudioValue = {
    area,
    params: p,
    navigate,
    today,
    type,
    setType: (x) => setTypeRaw(x),
    year: period.year,
    month: period.month,
    week: period.week,
    setPeriod: (x) => {
      const next = { ...period, ...x };
      if (x.year !== undefined && x.month === undefined) {
        next.month = "all";
        next.week = "all";
      }
      if (x.month !== undefined && x.week === undefined) next.week = "all";
      setPeriodRaw(next);
      const r = periodRange(next.year, next.month, next.week);
      const hit = r ? list.railAll.find((e) => e.dateKey >= r.from && e.dateKey <= r.to) : null;
      setRailJump(hit ? hit.id : null);
    },
    range,
    q: qRaw,
    setQ: setQRaw,
    searchOpen: searchOpen || qRaw !== "",
    setSearchOpen,
    folder,
    setFolder: (id) => {
      setFolderRaw(id);
      if (area !== "retro" || p.view === "editor") navigate({});
    },
    folderOpen,
    setFolderOpen,
    vm,
    setVm,
    railJump,
    resetFilters: () => {
      setPeriodRaw((x) => ({ ...x, month: "all", week: "all" }));
      setQRaw("");
      setSearchOpen(false);
      setTypeRaw("all");
      setFolderRaw("all");
    },
    list,
    folders: allFolders.folders,
    folderName,
    folderCount,
    topicCount,
    retroCount: local ? state.entries.length : list.all.length,
    openEntry: (id) => navigate({ view: "editor", entryId: id }),
    closeEntry: () => navigate({}),
    goToday: () => {
      setPeriodRaw({ year: today.slice(0, 4), month: String(+today.slice(5, 7)), week: "all" });
      setRailJump(null);
      navigate({});
    },
    newDialog,
    openNew: (date) => setNewDialog({ date: date ?? today }),
    closeNew: () => setNewDialog(null),
    createRetro: ({ date, title, folderId }) => {
      setNewDialog(null);
      const name = title.trim() || defaultTitle(t, locale, "daily", date);
      const apiActive = USE_API && !isDemo;
      const { entry, existed } = createDailyEntry(
        date,
        (srv) => {
          if (title.trim()) updateEntry(srv.id, { title: name });
          navigate({ view: "editor", entryId: srv.id });
          list.refetch();
        },
        folderId,
      );
      if (!existed && !apiActive) updateEntry(entry.id, { title: name });
      if (!existed) toast(t("retro.nd.created", { title: name }));
      navigate({ view: "editor", entryId: entry.id });
    },
    summaryKind,
    setSummaryKind,
    folderPrompt,
    setFolderPrompt,
    folderDelete,
    setFolderDelete,
    createFolder: async (name, parentId = null) => {
      const f = await app.createFolder(name, parentId);
      allFolders.invalidate();
      if (f) toast(t("retro.nd.folderCreated", { name }));
      return f?.id ?? null;
    },
    moveEntry: (e, folderId) => {
      void app.moveEntryToFolder(e.id, e.retroType, folderId).then(() => {
        list.refetch();
        toast(t("retro.ed.movedTo", { name: folderName(folderId) }));
      });
    },
    nestFolder: (id, parentId) => {
      if (id === parentId) return;
      void app.updateFolder(id, { parentFolderId: parentId }).then(() => allFolders.invalidate());
    },
    refreshFolders: () => {
      allFolders.invalidate();
      list.refetch();
    },
    toast,
  };

  return <RetroStudioCtx.Provider value={value}>{children}</RetroStudioCtx.Provider>;
}
