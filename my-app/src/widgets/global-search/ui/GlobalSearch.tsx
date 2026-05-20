import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { JournalEntry } from "@/entities/entry/model/types";
import type { AppRoute } from "@/app/model/types";
import type { Todo } from "@/entities/todo/model/types";
import { useTranslation } from "@/shared/lib/i18n";

interface Props {
  onNavigate?: (route: AppRoute) => void;
}

export function GlobalSearch({ onNavigate }: Props) {
  const { state } = useArchiveApp();
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

  const results = useMemo(() => {
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

  const hasResults = results.todos.length > 0 || results.entries.length > 0;

  return (
    <div className="global-search" data-open={open} ref={wrapRef}>
      <div className="global-search-wrap">
        <input
          ref={inputRef}
          className="global-search-input"
          placeholder={t("search.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
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
                    {results.todos.map((todo) => (
                      <SearchTodoRow
                        key={todo.id}
                        todo={todo}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.("todos");
                        }}
                      />
                    ))}
                  </>
                ) : null}
                {results.entries.length > 0 ? (
                  <>
                    <p className="global-search-section-title">
                      {t("search.section.entries")}
                    </p>
                    {results.entries.map((entry) => (
                      <SearchEntryRow
                        key={entry.id}
                        entry={entry}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.("retrospectives");
                        }}
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

function SearchTodoRow({ todo, onClick }: { todo: Todo; onClick: () => void }) {
  return (
    <button type="button" className="global-search-result" onClick={onClick}>
      <div>{todo.title}</div>
      <div className="global-search-result-meta">
        {todo.dateKey} · {todo.status}
      </div>
    </button>
  );
}

function SearchEntryRow({
  entry,
  onClick,
}: {
  entry: JournalEntry;
  onClick: () => void;
}) {
  return (
    <button type="button" className="global-search-result" onClick={onClick}>
      <div>{entry.title}</div>
      <div className="global-search-result-meta">
        {entry.dateKey} · {entry.retroType}
      </div>
    </button>
  );
}
