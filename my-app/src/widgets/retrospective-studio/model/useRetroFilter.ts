import { useMemo, useState } from "react";
import { getEntriesByRetroType } from "@/entities/entry/lib/selectors";
import type {
  JournalEntry,
  RetrospectiveType,
} from "@/entities/entry/model/types";
import { fromDateKey, getISOWeek } from "@/shared/lib/date";
import { PAGE_SIZE } from "./constants";

export interface UseRetroFilterResult {
  retroFilter: RetrospectiveType;
  setRetroFilter: (t: RetrospectiveType) => void;
  search: string;
  setSearch: (s: string) => void;
  yearFilter: string;
  setYearFilter: (s: string) => void;
  monthFilter: string;
  setMonthFilter: (s: string) => void;
  weekFilter: string;
  setWeekFilter: (s: string) => void;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  resetPage: () => void;
  totalPages: number;
  filteredEntries: JournalEntry[];
  pageEntries: JournalEntry[];
  years: string[];
  weeks: string[];
}

/**
 * Manages the retrospective sidebar's filter + pagination state.
 * Returns memoized derived lists (filteredEntries, pageEntries, years, weeks).
 */
export function useRetroFilter(entries: JournalEntry[]): UseRetroFilterResult {
  const [retroFilter, setRetroFilterRaw] =
    useState<RetrospectiveType>("daily");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilterRaw] = useState("all");
  const [monthFilter, setMonthFilterRaw] = useState("all");
  const [weekFilter, setWeekFilterRaw] = useState("all");
  const [page, setPage] = useState(0);

  const resetPage = () => setPage(0);

  // Wrappers that reset the page when the underlying filter changes.
  const setRetroFilter = (t: RetrospectiveType) => {
    setRetroFilterRaw(t);
    resetPage();
  };
  const setYearFilter = (s: string) => {
    setYearFilterRaw(s);
    resetPage();
  };
  const setMonthFilter = (s: string) => {
    setMonthFilterRaw(s);
    resetPage();
  };
  const setWeekFilter = (s: string) => {
    setWeekFilterRaw(s);
    resetPage();
  };

  const allOfType = useMemo(
    () => getEntriesByRetroType(entries, retroFilter),
    [entries, retroFilter],
  );

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = allOfType;

    if (yearFilter !== "all") {
      list = list.filter((e) => e.dateKey.startsWith(`${yearFilter}-`));
    }
    if (monthFilter !== "all") {
      list = list.filter((e) => e.dateKey.slice(5, 7) === monthFilter);
    }
    if (weekFilter !== "all") {
      list = list.filter((e) => {
        const w = getISOWeek(fromDateKey(e.dateKey));
        return String(w) === weekFilter;
      });
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.dateKey.includes(q) ||
          e.content.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [allOfType, search, yearFilter, monthFilter, weekFilter]);

  const years = useMemo(() => {
    const s = new Set(allOfType.map((e) => e.dateKey.slice(0, 4)));
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [allOfType]);

  const weeks = useMemo(() => {
    const s = new Set(
      allOfType.map((e) => String(getISOWeek(fromDateKey(e.dateKey)))),
    );
    return Array.from(s).sort((a, b) => Number(a) - Number(b));
  }, [allOfType]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pageStart = page * PAGE_SIZE;
  const pageEntries = filteredEntries.slice(pageStart, pageStart + PAGE_SIZE);

  return {
    retroFilter,
    setRetroFilter,
    search,
    setSearch: (s) => {
      setSearch(s);
      resetPage();
    },
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    weekFilter,
    setWeekFilter,
    page,
    setPage,
    resetPage,
    totalPages,
    filteredEntries,
    pageEntries,
    years,
    weeks,
  };
}
