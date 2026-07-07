import { useCallback, useEffect, useRef, useState } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";

export interface DailyEntriesPage {
  /** 현재 페이지(1-based). */
  page: number;
  setPage: (p: number) => void;
  /** 현재 페이지 항목 id(최신순). 실제 엔트리는 state.entries 에서 조회한다. */
  ids: string[];
  total: number;
  totalPages: number;
  loading: boolean;
  /** 서버 조회 실패 여부(목록 로드 실패 표시용). */
  error: boolean;
  /**
   * 서버 페이지네이션 활성 여부. 데모/mock 모드면 false → 호출부는 클라이언트
   * 목록(useRetroFilter)으로 폴백한다.
   */
  serverMode: boolean;
  /** 현재 페이지를 다시 조회한다(회고 생성/삭제 후 목록 갱신용). */
  refetch: () => void;
}

/**
 * 일간 회고 목록을 GET /entries/paginated 로 서버 페이지네이션 조회한다.
 * (주/월/연 요약은 소스가 /summaries 로 분리되므로 이 훅을 쓰지 않고 클라이언트
 *  목록을 그대로 유지한다.)
 *
 * @param enabled 일간 탭이 활성일 때만 조회하도록 하는 스위치.
 */
export function useDailyEntriesPage(enabled: boolean, size = 10): DailyEntriesPage {
  const { loadEntriesPage } = useArchiveApp();
  const [page, setPageState] = useState(1);
  const [ids, setIds] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [serverMode, setServerMode] = useState(true);
  // 경쟁 조건 방지: 마지막으로 시작한 요청만 상태에 반영한다.
  const reqRef = useRef(0);

  const fetchPage = useCallback(
    (p: number) => {
      const reqId = ++reqRef.current;
      setLoading(true);
      setError(false);
      void loadEntriesPage({ retroType: "daily", page: p, size })
        .then((res) => {
          if (reqId !== reqRef.current) return; // stale 응답 무시
          if (res === null) {
            setServerMode(false); // 데모/mock → 클라이언트 폴백
            return;
          }
          setServerMode(true);
          setIds(res.items.map((e) => e.id));
          setTotal(res.total);
        })
        .catch(() => {
          if (reqId === reqRef.current) setError(true);
        })
        .finally(() => {
          if (reqId === reqRef.current) setLoading(false);
        });
    },
    [loadEntriesPage, size],
  );

  useEffect(() => {
    if (!enabled) return;
    // 데이터 로드 시작 시 loading 플래그를 세우는 표준 패턴 — 동기 setState 이지만 의도적.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(page);
  }, [enabled, page, fetchPage]);

  const setPage = useCallback((p: number) => setPageState(Math.max(1, p)), []);

  const totalPages = Math.max(1, Math.ceil(total / size));

  return {
    page,
    setPage,
    ids,
    total,
    totalPages,
    loading,
    error,
    serverMode,
    refetch: () => fetchPage(page),
  };
}
