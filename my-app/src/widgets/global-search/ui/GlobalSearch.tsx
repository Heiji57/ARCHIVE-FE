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
  // 서버(GET /search) 응답 — 어떤 검색어에 대한 결과인지도 함께 기억해 stale 결과를 걸러낸다.
  const [serverState, setServerState] = useState<{
    q: string;
    result: GlobalSearchResult;
  } | null>(null);
  // 데모/mock 모드(서버 없음) → false, 로컬 필터로 폴백.
  const [serverMode, setServerMode] = useState(true);
  const reqRef = useRef(0);

  useEffect(() => {
    const needle = debouncedQ.trim();
    if (!needle) return;
    const reqId = ++reqRef.current;
    void globalSearch(needle, 6)
      .then((res) => {
        if (reqId !== reqRef.current) return; // stale 응답 무시
        if (res === null) {
          setServerMode(false); // 데모/mock → 로컬 필터로 폴백
          return;
        }
        setServerMode(true);
        setServerState({ q: needle, result: res });
      })
      .catch(() => {
        /* 네트워크 오류 — 아래 results 계산이 로컬 필터로 자동 폴백한다 */
      });
  }, [debouncedQ, globalSearch]);

  // 로컬 필터(데모/mock 폴백 + 디바운스 대기 중 즉시 미리보기용).
  const localResults = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return { todos: [], entries: [] };
    const todos = state.todos
      .filter((todo) => todo.title.toLowerCase().includes(needle))
      .slice(0, 6);
    const entries = state.entries
      .filter(
        (e) =>
          e.title.toLowerCase().includes(needle) ||
          e.content.toLowerCase().includes(needle),
      )
      .slice(0, 6);
    return { todos, entries };
  }, [state.todos, state.entries, q]);

  // 디바운스가 현재 입력값에 따라잡았고(q === debouncedQ) 그 검색어에 대한 서버
  // 응답이 이미 와 있으면 서버 결과를, 그 외(타이핑 중·데모)엔 로컬 결과를 쓴다.
  const settled = q.trim() === debouncedQ.trim();
  const results: GlobalSearchResult =
    serverMode && settled && serverState?.q === debouncedQ.trim()
      ? serverState.result
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
