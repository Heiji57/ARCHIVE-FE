import { useEffect, useMemo, useRef, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { JournalEntry, RetrospectiveType } from "@/entities/entry/model/types";
import { entryInRange, plainExcerpt, retroPeriod, sortForList, type PeriodRange } from "./retroList";

/** 카드 목록 한 번에 보이는 수(시안 PAGE 9). "N개 더 보기"로 늘린다. */
export const RETRO_PAGE = 9;
/** 서버에서 한 번에 받는 수. */
const SERVER_SIZE = 20;

export type RetroKindFilter = RetrospectiveType | "all";

export interface RetroListQuery {
  type: RetroKindFilter;
  /** "all" 이면 폴더를 가로질러 전부. */
  folder: string;
  q: string;
  range: PeriodRange | null;
}

export interface RetroListResult {
  /** 거르고 정렬한 목록 중 지금 보이는 만큼(카드). */
  shown: JournalEntry[];
  /** 기간 거르기 없이 거른 전체(넘기기용, 오래된 것부터). */
  railAll: JournalEntry[];
  /** 거르고 정렬한 지금까지 받은 전부. */
  all: JournalEntry[];
  remaining: number;
  more: () => void;
  loading: boolean;
  error: boolean;
  /** null: 아직 모름, false: 데모/mock(로컬 목록). */
  serverMode: boolean | null;
  refetch: () => void;
}

const matchQ = (e: JournalEntry, q: string) => {
  if (!q) return true;
  const s = q.toLowerCase();
  return e.title.toLowerCase().includes(s) || e.dateKey.includes(s) || plainExcerpt(e.content, 100000).toLowerCase().includes(s);
};

/**
 * 회고 목록. 데모/mock 은 state.entries 를 직접 거르고, 실제 모드는
 * 폴더 "all" 이면 GET /entries/paginated(q, from, to), 폴더를 고르면 GET /folders/contents 를
 * 페이지씩 이어 받는다. /folders/contents 는 검색과 기간을 받지 않아 받은 것 안에서 거른다.
 */
export function useRetroList(query: RetroListQuery): RetroListResult {
  const { state, loadEntriesPage, loadFolderContents } = useArchiveApp();
  const { type, folder, q, range } = query;
  const key = `${type}|${folder}|${q}|${range?.from ?? ""}~${range?.to ?? ""}`;

  // 거르기가 바뀌면 보이는 수와 서버 페이지를 처음으로(렌더 중 키 비교, effect 없이).
  const [paging, setPaging] = useState({ key, limit: RETRO_PAGE, page: 1 });
  const cur = paging.key === key ? paging : { key, limit: RETRO_PAGE, page: 1 };

  const [server, setServer] = useState<{ key: string; ids: string[]; total: number; mode: boolean | null }>({
    key: "",
    ids: [],
    total: 0,
    mode: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const req = useRef(0);

  useEffect(() => {
    const id = ++req.current;
    const page = cur.page;
    const retroType = type === "all" ? undefined : type;
    const load =
      folder === "all"
        ? loadEntriesPage({ retroType, page, size: SERVER_SIZE, q: q || undefined, from: range?.from, to: range?.to }).then((r) =>
            r ? { ids: r.items.map((x) => x.id), total: r.total } : null,
          )
        : loadFolderContents({ folderId: folder, retroType, page, size: SERVER_SIZE }).then((r) =>
            r ? { ids: r.entries.map((x) => x.id), total: Math.max(0, r.total - r.folders.length) } : null,
          );
    setLoading(true);
    setError(false);
    load
      .then((r) => {
        if (id !== req.current) return;
        if (r === null) {
          setServer({ key, ids: [], total: 0, mode: false });
          return;
        }
        setServer((prev) => ({
          key,
          ids: page > 1 && prev.key === key ? [...prev.ids, ...r.ids.filter((x) => !prev.ids.includes(x))] : r.ids,
          total: r.total,
          mode: true,
        }));
      })
      .catch(() => {
        if (id === req.current) setError(true);
      })
      .finally(() => {
        if (id === req.current) setLoading(false);
      });
    // key 가 type, folder, q, range 를 모두 담는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cur.page, tick, loadEntriesPage, loadFolderContents]);

  const mode = server.mode;
  const filterLocal = (list: JournalEntry[], withRange: boolean) =>
    list.filter(
      (e) =>
        (type === "all" || e.retroType === type) &&
        (folder === "all" || e.folderId === folder) &&
        matchQ(e, q) &&
        (!withRange || entryInRange(e, range)),
    );

  const all = useMemo(() => {
    if (mode !== true) return sortForList(filterLocal(state.entries, true));
    const byId = new Map(state.entries.map((e) => [e.id, e]));
    const got = (server.key === key ? server.ids : [])
      .map((id) => byId.get(id))
      .filter((e): e is JournalEntry => Boolean(e));
    return sortForList(folder === "all" ? got : filterLocal(got, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state.entries, server, key, folder]);

  // 넘기기: 기간 끝날 순서(오래된 것부터, 시안 railKey = until || date)
  const railAll = useMemo(() => {
    const end = (e: JournalEntry) => retroPeriod(e.retroType, e.dateKey).end;
    const src = mode === true ? all : filterLocal(state.entries, false);
    return [...src].sort((a, b) => end(a).localeCompare(end(b)) || a.id.localeCompare(b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, all, state.entries, key]);

  const total = mode === true && folder === "all" ? Math.max(server.total, all.length) : all.length;
  const shown = all.slice(0, cur.limit);
  const serverHasMore = mode === true && server.key === key && server.ids.length < server.total;
  const remaining = Math.max(0, (mode === true ? (serverHasMore ? Math.max(server.total, all.length) : all.length) : total) - shown.length);

  const more = () => {
    const limit = cur.limit + RETRO_PAGE;
    const needPage = mode === true && serverHasMore && limit > all.length;
    setPaging({ key, limit, page: needPage ? cur.page + 1 : cur.page });
  };

  return {
    shown,
    railAll,
    all,
    remaining,
    more,
    loading: loading && mode !== false,
    error: error && mode !== false,
    serverMode: mode,
    refetch: () => setTick((t) => t + 1),
  };
}
