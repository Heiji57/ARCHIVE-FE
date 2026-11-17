import { createContext, useContext } from "react";
import type { RetroRouteParams } from "@/app/router/navigation";
import type { JournalEntry } from "@/entities/entry/model/types";
import type { FolderSummary } from "@/entities/folder/model/types";
import type { SummaryKind } from "@/entities/summary/model/types";
import type { PeriodRange } from "./retroList";
import type { RetroKindFilter, RetroListResult } from "./useRetroList";

/** 회고 화면 상태(사이드바, 도구 막대, 본문이 같이 씀). 값은 RetroStudioProvider 가 만든다. */
export type RetroViewMode = "grid" | "rail";

export interface FolderPrompt {
  mode: "create" | "rename";
  folderId?: string;
  parentId?: string | null;
  name: string;
}

export interface RetroStudioValue {
  area: "retro" | "topic";
  params: RetroRouteParams;
  navigate: (p: RetroRouteParams) => void;
  today: string;
  // 거르기
  type: RetroKindFilter;
  setType: (t: RetroKindFilter) => void;
  year: string;
  month: string;
  week: string;
  setPeriod: (p: { year?: string; month?: string; week?: string }) => void;
  range: PeriodRange | null;
  q: string;
  setQ: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  folder: string;
  setFolder: (id: string) => void;
  folderOpen: boolean;
  setFolderOpen: (v: boolean) => void;
  vm: RetroViewMode;
  setVm: (v: RetroViewMode) => void;
  /** 넘기기에서 가운데 둘 회고(기간을 고르면 그 기간 첫 회고로 옮김). */
  railJump: string | null;
  resetFilters: () => void;
  // 데이터
  list: RetroListResult;
  folders: FolderSummary[];
  folderName: (id: string | null) => string;
  folderCount: (id: string) => number | null;
  topicCount: number | null;
  retroCount: number;
  // 동작
  openEntry: (id: string) => void;
  closeEntry: () => void;
  goToday: () => void;
  newDialog: { date: string } | null;
  openNew: (date?: string) => void;
  closeNew: () => void;
  createRetro: (p: { date: string; title: string; folderId: string | null }) => void;
  summaryKind: SummaryKind | null;
  setSummaryKind: (k: SummaryKind | null) => void;
  folderPrompt: FolderPrompt | null;
  setFolderPrompt: (p: FolderPrompt | null) => void;
  folderDelete: FolderSummary | null;
  setFolderDelete: (f: FolderSummary | null) => void;
  createFolder: (name: string, parentId?: string | null) => Promise<string | null>;
  moveEntry: (e: Pick<JournalEntry, "id" | "retroType">, folderId: string | null) => void;
  nestFolder: (folderId: string, parentId: string | null) => void;
  refreshFolders: () => void;
  toast: (title: string) => void;
}

export const RetroStudioCtx = createContext<RetroStudioValue | null>(null);

export function useRetroStudio(): RetroStudioValue {
  const v = useContext(RetroStudioCtx);
  if (!v) throw new Error("useRetroStudio must be used inside RetroStudioProvider");
  return v;
}

