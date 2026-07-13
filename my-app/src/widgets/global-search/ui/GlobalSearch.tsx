import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { JournalEntry } from "@/entities/entry/model/types";
import type { AppRoute } from "@/app/model/types";
import type { GlobalSearchResult } from "@/shared/api";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { useDebouncedValue } from "@/shared/lib/useDebouncedValue";

interface Props {
  onNavigate?: (route: AppRoute) => void;
}

// 서버 결과와 로컬 결과를 id 기준으로 중복 제거하며 병합한다(서버 우선).
function mergeById<T extends { id: string }>(
  primary: T[],
  secondary: T[],
  limit: number,
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of [...primary, ...secondary]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}

export function GlobalSearch({ onNavigate }: Props) {
  const { state, requestFocus, globalSearch } = useArchiveApp();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      // Slight delay so transition feels intentional
      const id = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(id);
    }
    // 닫힐 때 입력값 초기화(외부 open 상태와 동기화).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ("");
  }, [open]);

  // Close on outside click
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // 입력마다 GET /search 를 호출하지 않도록 디바운스한다.
  const debouncedQ = useDebouncedValue(q, 250);
  // 서버(GET /search) 응답을 검색어별로 캐싱한다 — 이전에 검색했던 검색어로
  // 되돌아가도(예: "ab" → "abc" → 다시 "ab") 재요청 없이 즉시 재사용한다.
  // ref 로 보관하고, 갱신 시 setCacheVersion 으로 리렌더만 트리거한다.
  const serverCacheRef = useRef<Map<string, GlobalSearchResult>>(new Map());
  const [, setCacheVersion] = useState(0);
  // 데모/mock 모드(서버 없음) → false, 로컬 필터로 폴백.
  const [serverMode, setServerMode] = useState(true);
  const reqRef = useRef(0);

  useEffect(() => {
    const needle = debouncedQ.trim();
    if (!needle) return;
    if (serverCacheRef.current.has(needle)) return; // 이미 캐시된 검색어 — 재요청 생략
    const reqId = ++reqRef.current;
    void globalSearch(needle, 6)
      .then((res) => {
        if (reqId !== reqRef.current) return; // stale 응답 무시
        if (res === null) {
          setServerMode(false); // 데모/mock → 로컬 필터로 폴백
          return;
        }
        setServerMode(true);
        const cache = serverCacheRef.current;
        cache.set(needle, res);
        if (cache.size > 20) {
          // Map 은 삽입 순서를 보존하므로 가장 오래된 항목부터 제거한다.
          const oldestKey = cache.keys().next().value;
          if (oldestKey !== undefined) cache.delete(oldestKey);
        }
        setCacheVersion((v) => v + 1); // ref 갱신을 화면에 반영
      })
      .catch(() => {
        /* 네트워크 오류 — 아래 results 계산이 로컬 필터로 자동 폴백한다 */
      });
  }, [debouncedQ, globalSearch]);

  // 로컬 필터 — 서버(GET /search)와 동일하게 daily 회고만 대상으로 한다
  // (주/월/연 요약은 서버 검색 범위 밖이라 로컬에서도 제외해야 두 결과가
  // 어긋나지 않는다). 타이핑 중 즉시 미리보기 + 데모/mock 폴백 + 서버 결과와의
  // 병합에 쓰인다.
  const localResults = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return { todos: [], entries: [] };
    const todos = state.todos
      .filter((todo) => todo.title.toLowerCase().includes(needle))
      .slice(0, 6);
    const entries = state.entries
      .filter((e) => e.retroType === "daily")
      .filter(
        (e) =>
          e.title.toLowerCase().includes(needle) ||
          e.content.toLowerCase().includes(needle),
      )
      .slice(0, 6);
    return { todos, entries };
  }, [state.todos, state.entries, q]);

  // 디바운스가 현재 입력값에 따라잡은(q === debouncedQ) 검색어의 서버 응답이
  // 캐시에 있으면 로컬 결과와 "병합"해서 보여준다(교체가 아니라 합집합, id로
  // 중복 제거하며 서버 결과 우선) — 서버 응답이 도착하는 순간 항목이 사라지거나
  // 리스트가 통째로 바뀌는 깜빡임을 없앤다. 아직 응답이 없거나(타이핑 중) 데모
  // 모드면 로컬 결과만 쓴다.
  const settled = q.trim() === debouncedQ.trim();
  const serverResult =
    serverMode && settled
      ? serverCacheRef.current.get(debouncedQ.trim())
      : undefined;
  const results: GlobalSearchResult = serverResult
    ? {
        todos: mergeById(serverResult.todos, localResults.todos, 6),
        entries: mergeById(serverResult.entries, localResults.entries, 6),
      }
    : localResults;

  const hasResults = results.todos.length > 0 || results.entries.length > 0;

  // 할 일 선택 → 캘린더로 이동해 해당 날짜/상세를 연다.
  const goToTodo = (todo: Todo) => {
    setOpen(false);
    requestFocus({ kind: "todo", todoId: todo.id, dateKey: todo.dateKey });
    onNavigate?.("calendar");
  };

  // 회고 선택 → 회고록으로 이동해 해당 회고를 연다.
  const goToEntry = (entry: JournalEntry) => {
    setOpen(false);
    requestFocus({ kind: "entry", entryId: entry.id });
    onNavigate?.("retrospectives");
  };

  // 화살표 이동을 위해 할일+회고를 화면 표시 순서(할일 먼저) 그대로 한 줄로 펼친다.
  type FlatResult =
    | { kind: "todo"; item: Todo }
    | { kind: "entry"; item: JournalEntry };
  const flatResults: FlatResult[] = useMemo(
    () => [
      ...results.todos.map((item): FlatResult => ({ kind: "todo", item })),
      ...results.entries.map((item): FlatResult => ({ kind: "entry", item })),
    ],
    [results],
  );

  // 하이라이트된 결과 인덱스(화살표 이동). 검색어가 바뀌면 첫 항목으로 리셋.
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  useEffect(() => {
    // 검색어 변경 시 이전 결과 기준 하이라이트를 유지하지 않도록 리셋 — 의도적.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedIndex(0);
  }, [q]);
  const activeIndex =
    flatResults.length > 0
      ? Math.min(highlightedIndex, flatResults.length - 1)
      : -1;

  const activateAt = (index: number) => {
    const target = flatResults[index];
    if (!target) return;
    if (target.kind === "todo") goToTodo(target.item);
    else goToEntry(target.item);
  };

  return (
    <div className="global-search" data-open={open} ref={wrapRef}>
      <div className="global-search-wrap">
        <input
          ref={inputRef}
          className="global-search-input"
          placeholder={t("search.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              activateAt(activeIndex);
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "ArrowDown") {
              if (flatResults.length === 0) return;
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, flatResults.length - 1));
            } else if (e.key === "ArrowUp") {
              if (flatResults.length === 0) return;
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, 0));
            }
          }}
        />
        {open ? (
          <Search size={14} className="global-search-icon" />
        ) : null}

        {open && q.trim() ? (
          <div className="global-search-results" role="listbox">
            {!hasResults ? (
              <div className="global-search-empty">{t("search.empty")}</div>
            ) : (
              <>
                {results.todos.length > 0 ? (
                  <>
                    <p className="global-search-section-title">
                      {t("search.section.todos")}
                    </p>
                    {results.todos.map((todo, i) => (
                      <SearchTodoRow
                        key={todo.id}
                        todo={todo}
                        highlighted={i === activeIndex}
                        onClick={() => goToTodo(todo)}
                      />
                    ))}
                  </>
                ) : null}
                {results.entries.length > 0 ? (
                  <>
                    <p className="global-search-section-title">
                      {t("search.section.entries")}
                    </p>
                    {results.entries.map((entry, i) => (
                      <SearchEntryRow
                        key={entry.id}
                        entry={entry}
                        highlighted={results.todos.length + i === activeIndex}
                        onClick={() => goToEntry(entry)}
                      />
                    ))}
                  </>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="btn-icon"
        aria-label={open ? t("search.close") : "Search"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={16} /> : <Search size={16} />}
      </button>
    </div>
  );
}

function SearchTodoRow({
  todo,
  highlighted,
  onClick,
}: {
  todo: Todo;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="global-search-result"
      data-highlighted={highlighted ? "true" : undefined}
      onClick={onClick}>
      <div>{todo.title}</div>
      <div className="global-search-result-meta">
        {todo.dateKey} · {todo.status}
      </div>
    </button>
  );
}

function SearchEntryRow({
  entry,
  highlighted,
  onClick,
}: {
  entry: JournalEntry;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="global-search-result"
      data-highlighted={highlighted ? "true" : undefined}
      onClick={onClick}>
      <div>{entry.title}</div>
      <div className="global-search-result-meta">
        {entry.dateKey} · {entry.retroType}
      </div>
    </button>
  );
}
